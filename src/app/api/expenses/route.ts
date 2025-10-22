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
  
  if (data.warranty !== undefined && data.warranty !== null) {
    if (category !== 'Hardware') {
      return { isValid: false, error: 'Warranty field is only applicable for Hardware category' };
    }
    if (!VALID_WARRANTY_VALUES.includes(data.warranty)) {
      return { isValid: false, error: `Warranty must be one of: ${VALID_WARRANTY_VALUES.join(', ')}` };
    }
  }

  if (data.expiredWarranty !== undefined && data.expiredWarranty !== null) {
    if (category !== 'Hardware') {
      return { isValid: false, error: 'Expired warranty field is only applicable for Hardware category' };
    }
    if (!isValidDate(data.expiredWarranty)) {
      return { isValid: false, error: 'Expired warranty must be a valid ISO date string' };
    }
  }

  if (data.licenseType !== undefined && data.licenseType !== null) {
    if (category !== 'Software' && category !== 'Website') {
      return { isValid: false, error: 'License type field is only applicable for Software/Website categories' };
    }
    if (!VALID_LICENSE_TYPES.includes(data.licenseType)) {
      return { isValid: false, error: `License type must be one of: ${VALID_LICENSE_TYPES.join(', ')}` };
    }
  }

  if (data.expiredSubscription !== undefined && data.expiredSubscription !== null) {
    if (category !== 'Software' && category !== 'Website') {
      return { isValid: false, error: 'Expired subscription field is only applicable for Software/Website categories' };
    }
    if (!isValidDate(data.expiredSubscription)) {
      return { isValid: false, error: 'Expired subscription must be a valid ISO date string' };
    }
  }

  return { isValid: true };
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

    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
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

    const insertData: any = {
      date: body.date,
      vendor: body.vendor.trim(),
      category: body.category,
      description: body.description.trim(),
      amount: typeof body.amount === 'string' ? parseFloat(body.amount) : body.amount,
      status: body.status,
      poNumber: body.poNumber.trim(),
      warranty: body.warranty || null,
      expiredWarranty: body.expiredWarranty || null,
      licenseType: body.licenseType || null,
      expiredSubscription: body.expiredSubscription || null,
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

    const updateData: any = {
      updatedAt: new Date().toISOString()
    };

    if (body.date !== undefined) updateData.date = body.date;
    if (body.vendor !== undefined) updateData.vendor = body.vendor.trim();
    if (body.category !== undefined) updateData.category = body.category;
    if (body.description !== undefined) updateData.description = body.description.trim();
    if (body.amount !== undefined) {
      updateData.amount = typeof body.amount === 'string' ? parseFloat(body.amount) : body.amount;
    }
    if (body.status !== undefined) updateData.status = body.status;
    if (body.poNumber !== undefined) updateData.poNumber = body.poNumber.trim();
    if (body.warranty !== undefined) updateData.warranty = body.warranty;
    if (body.expiredWarranty !== undefined) updateData.expiredWarranty = body.expiredWarranty;
    if (body.licenseType !== undefined) updateData.licenseType = body.licenseType;
    if (body.expiredSubscription !== undefined) updateData.expiredSubscription = body.expiredSubscription;

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