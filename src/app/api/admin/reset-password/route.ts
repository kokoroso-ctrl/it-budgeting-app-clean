import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { account } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

export async function POST(request: NextRequest) {
  try {
    const userId = 'I1Ig8At3tOsGuT0mqXo1d0aEbEHcZk24';
    const password = 'mamagreen123';
    
    // Generate bcrypt hash with 10 salt rounds
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Update the account with the new password hash
    const updated = await db.update(account)
      .set({
        password: passwordHash,
        updatedAt: new Date()
      })
      .where(eq(account.userId, userId))
      .returning();
    
    if (updated.length === 0) {
      return NextResponse.json(
        { 
          error: 'User account not found',
          code: 'ACCOUNT_NOT_FOUND'
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Password reset successfully',
      userId: userId,
      passwordReset: true
    }, { status: 200 });
    
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}