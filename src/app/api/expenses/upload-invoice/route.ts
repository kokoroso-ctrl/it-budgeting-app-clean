import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { expenses } from '@/db/schema';
import { eq } from 'drizzle-orm';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_FILE_TYPES = [...ALLOWED_IMAGE_TYPES, 'application/pdf'];

export async function POST(request: NextRequest) {
  try {
    // Parse multipart form data
    const formData = await request.formData();
    const expenseId = formData.get('expenseId') as string;
    const file = formData.get('file') as File;

    // Validate expenseId
    if (!expenseId) {
      return NextResponse.json(
        { error: 'Expense ID is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const parsedExpenseId = parseInt(expenseId);
    if (isNaN(parsedExpenseId)) {
      return NextResponse.json(
        { error: 'Valid expense ID is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Validate file
    if (!file) {
      return NextResponse.json(
        { error: 'File is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { 
          error: 'Invalid file type. Only images (JPG, JPEG, PNG, GIF, WEBP) and PDF files are allowed',
          code: 'VALIDATION_ERROR' 
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { 
          error: `File size exceeds maximum limit of 5MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB`,
          code: 'VALIDATION_ERROR' 
        },
        { status: 400 }
      );
    }

    // Check if expense exists
    const existingExpense = await db
      .select()
      .from(expenses)
      .where(eq(expenses.id, parsedExpenseId))
      .limit(1);

    if (existingExpense.length === 0) {
      return NextResponse.json(
        { error: 'Expense not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Data = buffer.toString('base64');

      // Update expense record with base64 data
      const updatedExpense = await db
        .update(expenses)
        .set({
          invoiceData: base64Data,
          invoiceMimeType: file.type,
          invoiceFilename: file.name,
          updatedAt: new Date()
        })
        .where(eq(expenses.id, parsedExpenseId))
        .returning();

    if (updatedExpense.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update expense', code: 'UPDATE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        filename: file.name,
        mimeType: file.type,
        size: file.size,
        expense: updatedExpense[0]
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('POST /api/expenses/upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}