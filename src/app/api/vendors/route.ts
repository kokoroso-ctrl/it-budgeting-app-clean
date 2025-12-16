import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { vendors, expenses } from '@/db/schema';
import { eq, like, and, or, desc, asc, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single vendor fetch
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({
          error: 'Valid ID is required',
          code: 'INVALID_ID',
        }, { status: 400 });
      }

      const vendor = await db.select()
        .from(vendors)
        .where(eq(vendors.id, parseInt(id)))
        .limit(1);

      if (vendor.length === 0) {
        return NextResponse.json({
          error: 'Vendor not found',
          code: 'VENDOR_NOT_FOUND',
        }, { status: 404 });
      }

        // Calculate total spent from expenses
        const totalSpentResult = await db.select({
          total: sql<number>`COALESCE(SUM(CAST(${expenses.amount} AS NUMERIC)), 0)`,
        })
        .from(expenses)
        .where(eq(expenses.vendor, vendor[0].name));

        const totalSpent = Number(totalSpentResult[0]?.total) || 0;

      return NextResponse.json({ ...vendor[0], totalSpent }, { status: 200 });
    }

    // List vendors with pagination, search, filtering, and sorting
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');
    const statusFilter = searchParams.get('status');
    const categoryFilter = searchParams.get('category');
    const sortField = searchParams.get('sort') || 'name';
    const sortOrder = searchParams.get('order') || 'asc';

    let query = db.select().from(vendors);

    // Build where conditions
    const conditions = [] as any[];

    if (search) {
      conditions.push(
        or(
          like(vendors.name, `%${search}%`),
          like(vendors.category, `%${search}%`),
        ),
      );
    }

    if (statusFilter) {
      conditions.push(eq(vendors.status, statusFilter));
    }

    if (categoryFilter) {
      conditions.push(eq(vendors.category, categoryFilter));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply sorting (except totalSpent which needs to be calculated)
    if (sortField !== 'totalSpent') {
      const sortColumn = sortField === 'contracts' ? vendors.contracts
        : sortField === 'createdAt' ? vendors.createdAt
        : sortField === 'updatedAt' ? vendors.updatedAt
        : sortField === 'category' ? vendors.category
        : vendors.name;

      query = sortOrder === 'desc'
        ? query.orderBy(desc(sortColumn))
        : query.orderBy(asc(sortColumn));
    }

    const results = await query.limit(limit).offset(offset);

    // Calculate total spent for each vendor from expenses
    const vendorsWithTotals = await Promise.all(
      results.map(async (vendor) => {
        const totalSpentResult = await db.select({
          total: sql<number>`COALESCE(SUM(${expenses.amount}), 0)`,
        })
        .from(expenses)
        .where(eq(expenses.vendor, vendor.name));

        const totalSpent = totalSpentResult[0]?.total || 0;

        return {
          ...vendor,
          totalSpent,
        };
      }),
    );

    // Sort by totalSpent if requested
    if (sortField === 'totalSpent') {
      vendorsWithTotals.sort((a, b) => {
        return sortOrder === 'desc'
          ? b.totalSpent - a.totalSpent
          : a.totalSpent - b.totalSpent;
      });
    }

    return NextResponse.json(vendorsWithTotals, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + error,
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, category, contracts, status } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({
        error: 'Name is required and must be a non-empty string',
        code: 'MISSING_REQUIRED_FIELD',
      }, { status: 400 });
    }

    if (!category || typeof category !== 'string' || category.trim() === '') {
      return NextResponse.json({
        error: 'Category is required and must be a non-empty string',
        code: 'MISSING_REQUIRED_FIELD',
      }, { status: 400 });
    }

    if (!status || typeof status !== 'string') {
      return NextResponse.json({
        error: 'Status is required',
        code: 'MISSING_REQUIRED_FIELD',
      }, { status: 400 });
    }

    // Validate status value
    const validStatuses = ['active', 'inactive'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({
        error: 'Status must be one of: active, inactive',
        code: 'INVALID_STATUS',
      }, { status: 400 });
    }

    // Sanitize inputs
    const trimmedName = name.trim();
    const trimmedCategory = category.trim();

    // Check for duplicate name
    const existingVendor = await db.select()
      .from(vendors)
      .where(eq(vendors.name, trimmedName))
      .limit(1);

    if (existingVendor.length > 0) {
      return NextResponse.json({
        error: 'A vendor with this name already exists',
        code: 'DUPLICATE_VENDOR_NAME',
      }, { status: 400 });
    }

    // Validate contracts
    const validatedContracts = contracts !== undefined ? parseInt(contracts) : 0;
    if (isNaN(validatedContracts) || validatedContracts < 0 || !Number.isInteger(parseFloat(contracts || '0'))) {
      return NextResponse.json({
        error: 'Contracts must be a non-negative integer',
        code: 'INVALID_CONTRACTS',
      }, { status: 400 });
    }

      // Create vendor (totalSpent removed - will be calculated from expenses)
      const newVendor = await db.insert(vendors)
        .values({
          name: trimmedName,
          category: trimmedCategory,
          totalSpent: 0, // Set to 0, will be calculated from expenses
          contracts: validatedContracts,
          status,
        })
        .returning();

    // Calculate total spent from expenses
    const totalSpentResult = await db.select({
      total: sql<number>`COALESCE(SUM(${expenses.amount}), 0)`,
    })
    .from(expenses)
    .where(eq(expenses.vendor, trimmedName));

    const totalSpent = totalSpentResult[0]?.total || 0;

    return NextResponse.json({ ...newVendor[0], totalSpent }, { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + error,
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
        code: 'INVALID_ID',
      }, { status: 400 });
    }

    // Check if vendor exists
    const existingVendor = await db.select()
      .from(vendors)
      .where(eq(vendors.id, parseInt(id)))
      .limit(1);

    if (existingVendor.length === 0) {
      return NextResponse.json({
        error: 'Vendor not found',
        code: 'VENDOR_NOT_FOUND',
      }, { status: 404 });
    }

    const body = await request.json();
    const { name, category, contracts, status } = body;

      const updates: any = {};

    // Validate and add name if provided
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim() === '') {
        return NextResponse.json({
          error: 'Name must be a non-empty string',
          code: 'INVALID_NAME',
        }, { status: 400 });
      }

      const trimmedName = name.trim();

      // Check for duplicate name (excluding current vendor)
      const duplicateVendor = await db.select()
        .from(vendors)
        .where(eq(vendors.name, trimmedName))
        .limit(1);

      if (duplicateVendor.length > 0 && duplicateVendor[0].id !== parseInt(id)) {
        return NextResponse.json({
          error: 'A vendor with this name already exists',
          code: 'DUPLICATE_VENDOR_NAME',
        }, { status: 400 });
      }

      updates.name = trimmedName;
    }

    // Validate and add category if provided
    if (category !== undefined) {
      if (typeof category !== 'string' || category.trim() === '') {
        return NextResponse.json({
          error: 'Category must be a non-empty string',
          code: 'INVALID_CATEGORY',
        }, { status: 400 });
      }

      updates.category = category.trim();
    }

    // totalSpent removed - will be calculated from expenses

    // Validate and add contracts if provided
    if (contracts !== undefined) {
      const validatedContracts = parseInt(contracts);
      if (isNaN(validatedContracts) || validatedContracts < 0 || !Number.isInteger(parseFloat(contracts))) {
        return NextResponse.json({
          error: 'Contracts must be a non-negative integer',
          code: 'INVALID_CONTRACTS',
        }, { status: 400 });
      }
      updates.contracts = validatedContracts;
    }

    // Validate and add status if provided
    if (status !== undefined) {
      const validStatuses = ['active', 'inactive'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({
          error: 'Status must be one of: active, inactive',
          code: 'INVALID_STATUS',
        }, { status: 400 });
      }
      updates.status = status;
    }

    const updated = await db.update(vendors)
      .set(updates)
      .where(eq(vendors.id, parseInt(id)))
      .returning();

    // Calculate total spent from expenses
    const vendorName = updated[0].name;
    const totalSpentResult = await db.select({
      total: sql<number>`COALESCE(SUM(${expenses.amount}), 0)`,
    })
    .from(expenses)
    .where(eq(expenses.vendor, vendorName));

    const totalSpent = totalSpentResult[0]?.total || 0;

    return NextResponse.json({ ...updated[0], totalSpent }, { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + error,
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
        code: 'INVALID_ID',
      }, { status: 400 });
    }

    // Check if vendor exists
    const existingVendor = await db.select()
      .from(vendors)
      .where(eq(vendors.id, parseInt(id)))
      .limit(1);

    if (existingVendor.length === 0) {
      return NextResponse.json({
        error: 'Vendor not found',
        code: 'VENDOR_NOT_FOUND',
      }, { status: 404 });
    }

    const deleted = await db.delete(vendors)
      .where(eq(vendors.id, parseInt(id)))
      .returning();

    return NextResponse.json({
      message: 'Vendor deleted successfully',
      vendor: deleted[0],
    }, { status: 200 });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + error,
    }, { status: 500 });
  }
}
