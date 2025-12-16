import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { budgets } from '@/db/schema';
import { eq, like, and, or, desc, asc } from 'drizzle-orm';

const VALID_QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4', 'Annual'];
const VALID_CATEGORIES = ['Hardware', 'Software', 'Website', 'Personnel', 'Services', 'Infrastructure'];
const VALID_STATUSES = ['approved', 'pending', 'draft', 'rejected'];
const MIN_YEAR = 2020;
const MAX_YEAR = 2030;

function validateBudgetData(data: any, isUpdate = false) {
  const errors: string[] = [];

  if (!isUpdate || 'name' in data) {
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
      errors.push('Name is required and must be a non-empty string');
    }
  }

  if (!isUpdate || 'year' in data) {
    if (data.year === undefined || data.year === null) {
      errors.push('Year is required');
    } else {
      const year = parseInt(data.year);
      if (isNaN(year) || year < MIN_YEAR || year > MAX_YEAR) {
        errors.push(`Year must be a valid integer between ${MIN_YEAR} and ${MAX_YEAR}`);
      }
    }
  }

  if (!isUpdate || 'quarter' in data) {
    if (!data.quarter || typeof data.quarter !== 'string') {
      errors.push('Quarter is required');
    } else if (!VALID_QUARTERS.includes(data.quarter)) {
      errors.push(`Quarter must be one of: ${VALID_QUARTERS.join(', ')}`);
    }
  }

  if (!isUpdate || 'category' in data) {
    if (!data.category || typeof data.category !== 'string') {
      errors.push('Category is required');
    } else if (!VALID_CATEGORIES.includes(data.category)) {
      errors.push(`Category must be one of: ${VALID_CATEGORIES.join(', ')}`);
    }
  }

  if (!isUpdate || 'amount' in data) {
    if (data.amount === undefined || data.amount === null) {
      errors.push('Amount is required');
    } else {
      const amount = parseFloat(data.amount);
      if (isNaN(amount) || amount <= 0) {
        errors.push('Amount must be a positive number');
      }
    }
  }

  if (!isUpdate || 'status' in data) {
    if (!data.status || typeof data.status !== 'string') {
      errors.push('Status is required');
    } else if (!VALID_STATUSES.includes(data.status)) {
      errors.push(`Status must be one of: ${VALID_STATUSES.join(', ')}`);
    }
  }

  if (!isUpdate || 'createdBy' in data) {
    if (!data.createdBy || typeof data.createdBy !== 'string' || data.createdBy.trim().length === 0) {
      errors.push('CreatedBy is required and must be a non-empty string');
    }
  }

  if ('approver' in data && data.approver !== null && data.approver !== undefined) {
    if (typeof data.approver !== 'string') {
      errors.push('Approver must be a string');
    }
  }

  if ('description' in data && data.description !== null && data.description !== undefined) {
    if (typeof data.description !== 'string') {
      errors.push('Description must be a string');
    }
  }

  return errors;
}

function sanitizeBudgetData(data: any) {
  const sanitized: any = {};

  if ('name' in data) sanitized.name = data.name.trim();
  if ('year' in data) sanitized.year = parseInt(data.year);
  if ('quarter' in data) sanitized.quarter = data.quarter;
  if ('category' in data) sanitized.category = data.category;
  if ('amount' in data) sanitized.amount = parseFloat(data.amount);
  if ('status' in data) sanitized.status = data.status;
  if ('createdBy' in data) sanitized.createdBy = data.createdBy.trim();
  if ('approver' in data) sanitized.approver = data.approver ? data.approver.trim() : null;
  if ('description' in data) sanitized.description = data.description ? data.description.trim() : null;

  return sanitized;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const budget = await db
        .select()
        .from(budgets)
        .where(eq(budgets.id, parseInt(id)))
        .limit(1);

      if (budget.length === 0) {
        return NextResponse.json(
          { error: 'Budget not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(budget[0], { status: 200 });
    }

    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');
    const year = searchParams.get('year');
    const quarter = searchParams.get('quarter');
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const sortField = searchParams.get('sort') || 'year';
    const sortOrder = searchParams.get('order') || 'desc';

    const conditions = [];

    if (search) {
      conditions.push(
        or(
          like(budgets.name, `%${search}%`),
          like(budgets.description, `%${search}%`)
        )
      );
    }

    if (year) {
      const yearInt = parseInt(year);
      if (!isNaN(yearInt)) {
        conditions.push(eq(budgets.year, yearInt));
      }
    }

    if (quarter && VALID_QUARTERS.includes(quarter)) {
      conditions.push(eq(budgets.quarter, quarter));
    }

    if (category && VALID_CATEGORIES.includes(category)) {
      conditions.push(eq(budgets.category, category));
    }

    if (status && VALID_STATUSES.includes(status)) {
      conditions.push(eq(budgets.status, status));
    }

    let query = db.select().from(budgets);

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const orderColumn = sortField === 'year' ? budgets.year :
                       sortField === 'quarter' ? budgets.quarter :
                       sortField === 'amount' ? budgets.amount :
                       sortField === 'status' ? budgets.status :
                       sortField === 'createdAt' ? budgets.createdAt :
                       budgets.year;

    const orderDirection = sortOrder === 'asc' ? asc(orderColumn) : desc(orderColumn);

    const results = await query
      .orderBy(orderDirection)
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validationErrors = validateBudgetData(body, false);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: validationErrors.join('; '), code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const sanitizedData = sanitizeBudgetData(body);

      const newBudget = await db
        .insert(budgets)
        .values({
          ...sanitizedData,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

    return NextResponse.json(newBudget[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const body = await request.json();

    const validationErrors = validateBudgetData(body, true);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: validationErrors.join('; '), code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const existingBudget = await db
      .select()
      .from(budgets)
      .where(eq(budgets.id, parseInt(id)))
      .limit(1);

    if (existingBudget.length === 0) {
      return NextResponse.json(
        { error: 'Budget not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const sanitizedData = sanitizeBudgetData(body);

    const updated = await db
      .update(budgets)
      .set({
        ...sanitizedData,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(budgets.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const existingBudget = await db
      .select()
      .from(budgets)
      .where(eq(budgets.id, parseInt(id)))
      .limit(1);

    if (existingBudget.length === 0) {
      return NextResponse.json(
        { error: 'Budget not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const deleted = await db
      .delete(budgets)
      .where(eq(budgets.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'Budget deleted successfully',
        budget: deleted[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { budgets } from '@/db/schema';
import { eq, like, and, or, desc, asc } from 'drizzle-orm';

const VALID_QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4', 'Annual'];
const VALID_CATEGORIES = ['Hardware', 'Software', 'Website', 'Personnel', 'Services', 'Infrastructure'];
const VALID_STATUSES = ['approved', 'pending', 'draft', 'rejected'];
const MIN_YEAR = 2020;
const MAX_YEAR = 2030;

function validateBudgetData(data: any, isUpdate = false) {
  const errors: string[] = [];

  if (!isUpdate || 'name' in data) {
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
      errors.push('Name is required and must be a non-empty string');
    }
  }

  if (!isUpdate || 'year' in data) {
    if (data.year === undefined || data.year === null) {
      errors.push('Year is required');
    } else {
      const year = parseInt(data.year);
      if (isNaN(year) || year < MIN_YEAR || year > MAX_YEAR) {
        errors.push(`Year must be a valid integer between ${MIN_YEAR} and ${MAX_YEAR}`);
      }
    }
  }

  if (!isUpdate || 'quarter' in data) {
    if (!data.quarter || typeof data.quarter !== 'string') {
      errors.push('Quarter is required');
    } else if (!VALID_QUARTERS.includes(data.quarter)) {
      errors.push(`Quarter must be one of: ${VALID_QUARTERS.join(', ')}`);
    }
  }

  if (!isUpdate || 'category' in data) {
    if (!data.category || typeof data.category !== 'string') {
      errors.push('Category is required');
    } else if (!VALID_CATEGORIES.includes(data.category)) {
      errors.push(`Category must be one of: ${VALID_CATEGORIES.join(', ')}`);
    }
  }

  if (!isUpdate || 'amount' in data) {
    if (data.amount === undefined || data.amount === null) {
      errors.push('Amount is required');
    } else {
      const amount = parseFloat(data.amount);
      if (isNaN(amount) || amount <= 0) {
        errors.push('Amount must be a positive number');
      }
    }
  }

  if (!isUpdate || 'status' in data) {
    if (!data.status || typeof data.status !== 'string') {
      errors.push('Status is required');
    } else if (!VALID_STATUSES.includes(data.status)) {
      errors.push(`Status must be one of: ${VALID_STATUSES.join(', ')}`);
    }
  }

  if (!isUpdate || 'createdBy' in data) {
    if (!data.createdBy || typeof data.createdBy !== 'string' || data.createdBy.trim().length === 0) {
      errors.push('CreatedBy is required and must be a non-empty string');
    }
  }

  if ('approver' in data && data.approver !== null && data.approver !== undefined) {
    if (typeof data.approver !== 'string') {
      errors.push('Approver must be a string');
    }
  }

  if ('description' in data && data.description !== null && data.description !== undefined) {
    if (typeof data.description !== 'string') {
      errors.push('Description must be a string');
    }
  }

  return errors;
}

function sanitizeBudgetData(data: any) {
  const sanitized: any = {};

  if ('name' in data) sanitized.name = data.name.trim();
  if ('year' in data) sanitized.year = parseInt(data.year);
  if ('quarter' in data) sanitized.quarter = data.quarter;
  if ('category' in data) sanitized.category = data.category;
  if ('amount' in data) sanitized.amount = parseFloat(data.amount);
  if ('status' in data) sanitized.status = data.status;
  if ('createdBy' in data) sanitized.createdBy = data.createdBy.trim();
  if ('approver' in data) sanitized.approver = data.approver ? data.approver.trim() : null;
  if ('description' in data) sanitized.description = data.description ? data.description.trim() : null;

  return sanitized;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const budget = await db
        .select()
        .from(budgets)
        .where(eq(budgets.id, parseInt(id)))
        .limit(1);

      if (budget.length === 0) {
        return NextResponse.json(
          { error: 'Budget not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(budget[0], { status: 200 });
    }

    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');
    const year = searchParams.get('year');
    const quarter = searchParams.get('quarter');
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const sortField = searchParams.get('sort') || 'year';
    const sortOrder = searchParams.get('order') || 'desc';

    const conditions = [];

    if (search) {
      conditions.push(
        or(
          like(budgets.name, `%${search}%`),
          like(budgets.description, `%${search}%`)
        )
      );
    }

    if (year) {
      const yearInt = parseInt(year);
      if (!isNaN(yearInt)) {
        conditions.push(eq(budgets.year, yearInt));
      }
    }

    if (quarter && VALID_QUARTERS.includes(quarter)) {
      conditions.push(eq(budgets.quarter, quarter));
    }

    if (category && VALID_CATEGORIES.includes(category)) {
      conditions.push(eq(budgets.category, category));
    }

    if (status && VALID_STATUSES.includes(status)) {
      conditions.push(eq(budgets.status, status));
    }

    let query = db.select().from(budgets);

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const orderColumn = sortField === 'year' ? budgets.year :
                       sortField === 'quarter' ? budgets.quarter :
                       sortField === 'amount' ? budgets.amount :
                       sortField === 'status' ? budgets.status :
                       sortField === 'createdAt' ? budgets.createdAt :
                       budgets.year;

    const orderDirection = sortOrder === 'asc' ? asc(orderColumn) : desc(orderColumn);

    const results = await query
      .orderBy(orderDirection)
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validationErrors = validateBudgetData(body, false);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: validationErrors.join('; '), code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const sanitizedData = sanitizeBudgetData(body);

      const newBudget = await db
        .insert(budgets)
        .values({
          ...sanitizedData,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

    return NextResponse.json(newBudget[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const body = await request.json();

    const validationErrors = validateBudgetData(body, true);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: validationErrors.join('; '), code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const existingBudget = await db
      .select()
      .from(budgets)
      .where(eq(budgets.id, parseInt(id)))
      .limit(1);

    if (existingBudget.length === 0) {
      return NextResponse.json(
        { error: 'Budget not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const sanitizedData = sanitizeBudgetData(body);

      const updated = await db
        .update(budgets)
        .set({
          ...sanitizedData,
          updatedAt: new Date(),
        })
        .where(eq(budgets.id, parseInt(id)))
        .returning();

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const existingBudget = await db
      .select()
      .from(budgets)
      .where(eq(budgets.id, parseInt(id)))
      .limit(1);

    if (existingBudget.length === 0) {
      return NextResponse.json(
        { error: 'Budget not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const deleted = await db
      .delete(budgets)
      .where(eq(budgets.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'Budget deleted successfully',
        budget: deleted[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}