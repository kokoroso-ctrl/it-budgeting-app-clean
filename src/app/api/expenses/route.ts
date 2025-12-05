import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { expenses } from '@/db/schema';
import { eq, like, and, or, desc, asc } from 'drizzle-orm';

const VALID_CATEGORIES = ['Hardware', 'Software', 'Website', 'Personnel', 'Services', 'Infrastructure', 'Accessories & Office Supply'];
const VALID_STATUSES = ['approved', 'pending', 'rejected'];
const VALID_WARRANTY_VALUES = ['Ada', 'Tidak Ada'];
const VALID_LICENSE_TYPES = ['Subscription', 'Perpetual', 'OEM'];

function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime()) && dateString.includes('T');
}

function validateExpenseData(data: any, isUpdate: boolean = false): { isValid: boolean; error?: string } {
  if (!isUpdate || data.date !== undefined) {
    if (!data.date) {
      return { isValid: false, error: 'Date is required' };
    }
    if (!isValidDate(data.date)) {
      return { isValid: false, error: 'Date must be a valid ISO date string' };
    }
  }

  if (!isUpdate || data.vendor !== undefined) {
    if (!data.vendor || typeof data.vendor !== 'string' || data.vendor.trim() === '') {
      return { isValid: false, error: 'Vendor is required' };
    }
  }

  if (!isUpdate || data.category !== undefined) {
    if (!data.category) {
      return { isValid: false, error: 'Category is required' };
    }
    if (!VALID_CATEGORIES.includes(data.category)) {
      return { isValid: false, error: `Category must be one of: ${VALID_CATEGORIES.join(', ')}` };
    }
  }

  if (!isUpdate || data.description !== undefined) {
    if (!data.description || typeof data.description !== 'string' || data.description.trim() === '') {
      return { isValid: false, error: 'Description is required' };
    }
  }

  if (!isUpdate || data.amount !== undefined) {
    if (data.amount === undefined || data.amount === null) {
      return { isValid: false, error: 'Amount is required' };
    }
    const amount = typeof data.amount === 'string' ? parseFloat(data.amount) : data.amount;
    if (isNaN(amount) || amount <= 0) {
      return { isValid: false, error: 'Amount must be a positive number' };
    }
  }

  if (!isUpdate || data.status !== undefined) {
    if (!data.status) {
      return { isValid: false, error: 'Status is required' };
    }
    if (!VALID_STATUSES.includes(data.status)) {
      return { isValid: false, error: `Status must be one of: ${VALID_STATUSES.join(', ')}` };
    }
  }

  if (!isUpdate || data.poNumber !== undefined) {
    if (!data.poNumber || typeof data.poNumber !== 'string' || data.poNumber.trim() === '') {
      return { isValid: false, error: 'PO Number is required' };
    }
  }

  const category = data.category || '';
  
  // Only validate warranty fields if they have actual values AND category is Hardware
  if (data.warranty !== undefined && data.warranty !== null && data.warranty !== '') {
    if (category === 'Hardware') {
      if (!VALID_WARRANTY_VALUES.includes(data.warranty)) {
        return { isValid: false, error: `Warranty must be one of: ${VALID_WARRANTY_VALUES.join(', ')}` };
      }
    }
    // If category is NOT Hardware but warranty is provided, we'll ignore it (not reject)
  }

  if (data.expiredWarranty !== undefined && data.expiredWarranty !== null && data.expiredWarranty !== '') {
    if (category === 'Hardware') {
      if (!isValidDate(data.expiredWarranty)) {
        return { isValid: false, error: 'Expired warranty must be a valid ISO date string' };
      }
    }
    // If category is NOT Hardware but expiredWarranty is provided, we'll ignore it (not reject)
  }

  // Only validate license fields if they have actual values AND category is Software/Website
  if (data.licenseType !== undefined && data.licenseType !== null && data.licenseType !== '') {
    if (category === 'Software' || category === 'Website') {
      if (!VALID_LICENSE_TYPES.includes(data.licenseType)) {
        return { isValid: false, error: `License type must be one of: ${VALID_LICENSE_TYPES.join(', ')}` };
      }
    }
    // If category is NOT Software/Website but licenseType is provided, we'll ignore it (not reject)
  }

  if (data.expiredSubscription !== undefined && data.expiredSubscription !== null && data.expiredSubscription !== '') {
    if (category === 'Software' || category === 'Website') {
      if (!isValidDate(data.expiredSubscription)) {
        return { isValid: false, error: 'Expired subscription must be a valid ISO date string' };
      }
    }
    // If category is NOT Software/Website but expiredSubscription is provided, we'll ignore it (not reject)
  }

  return { isValid: true };
}

// Helper function to clean data based on category
function cleanDataByCategory(data: any, existingCategory?: string): any {
  const cleaned = { ...data };
  
  // Get the category to use for cleaning
  const categoryToCheck = cleaned.category || existingCategory;
  
  // Only clean fields if category is explicitly provided in the update
  // This prevents accidental deletion when doing partial updates (e.g., status only)
  if (cleaned.category !== undefined) {
    // Only keep warranty fields for Hardware
    if (categoryToCheck !== 'Hardware') {
      cleaned.warranty = null;
      cleaned.expiredWarranty = null;
    }
    
    // Only keep license fields for Software/Website
    if (categoryToCheck !== 'Software' && categoryToCheck !== 'Website') {
      cleaned.licenseType = null;
      cleaned.expiredSubscription = null;
    }
  }
  
  return cleaned;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (id) {
      if (isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: 'Valid ID is required',
          code: 'INVALID_ID' 
        }, { status: 400 });
      }

      const expense = await db.select()
        .from(expenses)
        .where(eq(expenses.id, parseInt(id)))
        .limit(1);

      if (expense.length === 0) {
        return NextResponse.json({ 
          error: 'Expense not found',
          code: 'NOT_FOUND' 
        }, { status: 404 });
      }

      return NextResponse.json(expense[0], { status: 200 });
    }

    const limit = parseInt(searchParams.get('limit') || '1000');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const sortField = searchParams.get('sort') || 'date';
    const sortOrder = searchParams.get('order') || 'desc';

    let query = db.select().from(expenses);

    const conditions = [];

    if (search) {
      conditions.push(
        or(
          like(expenses.vendor, `%${search}%`),
          like(expenses.description, `%${search}%`)
        )
      );
    }

    if (category) {
      conditions.push(eq(expenses.category, category));
    }

    if (status) {
      conditions.push(eq(expenses.status, status));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const orderByColumn = sortField === 'date' ? expenses.date :
                          sortField === 'amount' ? expenses.amount :
                          sortField === 'vendor' ? expenses.vendor :
                          sortField === 'category' ? expenses.category :
                          expenses.date;

    if (sortOrder === 'asc') {
      query = query.orderBy(asc(orderByColumn));
    } else {
      query = query.orderBy(desc(orderByColumn));
    }

    const results = await query.limit(limit).offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = validateExpenseData(body);
    if (!validation.isValid) {
      return NextResponse.json({ 
        error: validation.error,
        code: 'VALIDATION_ERROR' 
      }, { status: 400 });
    }

    // Clean data based on category
    const cleanedData = cleanDataByCategory(body);

    const insertData: any = {
      date: cleanedData.date,
      vendor: cleanedData.vendor.trim(),
      category: cleanedData.category,
      description: cleanedData.description.trim(),
      amount: typeof cleanedData.amount === 'string' ? parseFloat(cleanedData.amount) : cleanedData.amount,
      status: cleanedData.status,
      poNumber: cleanedData.poNumber.trim(),
      warranty: cleanedData.warranty || null,
      expiredWarranty: cleanedData.expiredWarranty || null,
      licenseType: cleanedData.licenseType || null,
      expiredSubscription: cleanedData.expiredSubscription || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const newExpense = await db.insert(expenses)
      .values(insertData)
      .returning();

    return NextResponse.json(newExpense[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    const existing = await db.select()
      .from(expenses)
      .where(eq(expenses.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ 
        error: 'Expense not found',
        code: 'NOT_FOUND' 
      }, { status: 404 });
    }

    const body = await request.json();

    const validation = validateExpenseData(body, true);
    if (!validation.isValid) {
      return NextResponse.json({ 
        error: validation.error,
        code: 'VALIDATION_ERROR' 
      }, { status: 400 });
    }

    // Clean data based on category
    const cleanedData = cleanDataByCategory(body, existing[0].category);

    const updateData: any = {
      updatedAt: new Date().toISOString()
    };

    if (cleanedData.date !== undefined) updateData.date = cleanedData.date;
    if (cleanedData.vendor !== undefined) updateData.vendor = cleanedData.vendor.trim();
    if (cleanedData.category !== undefined) updateData.category = cleanedData.category;
    if (cleanedData.description !== undefined) updateData.description = cleanedData.description.trim();
    if (cleanedData.amount !== undefined) {
      updateData.amount = typeof cleanedData.amount === 'string' ? parseFloat(cleanedData.amount) : cleanedData.amount;
    }
    if (cleanedData.status !== undefined) updateData.status = cleanedData.status;
    if (cleanedData.poNumber !== undefined) updateData.poNumber = cleanedData.poNumber.trim();
    if (cleanedData.warranty !== undefined) updateData.warranty = cleanedData.warranty;
    if (cleanedData.expiredWarranty !== undefined) updateData.expiredWarranty = cleanedData.expiredWarranty;
    if (cleanedData.licenseType !== undefined) updateData.licenseType = cleanedData.licenseType;
    if (cleanedData.expiredSubscription !== undefined) updateData.expiredSubscription = cleanedData.expiredSubscription;

    const updated = await db.update(expenses)
      .set(updateData)
      .where(eq(expenses.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    const existing = await db.select()
      .from(expenses)
      .where(eq(expenses.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ 
        error: 'Expense not found',
        code: 'NOT_FOUND' 
      }, { status: 404 });
    }

    const deleted = await db.delete(expenses)
      .where(eq(expenses.id, parseInt(id)))
      .returning();

    return NextResponse.json({
      message: 'Expense deleted successfully',
      expense: deleted[0]
    }, { status: 200 });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}