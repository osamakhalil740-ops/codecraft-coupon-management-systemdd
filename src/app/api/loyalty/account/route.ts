/**

// Force dynamic rendering
export const dynamic = 'force-dynamic';

 * Loyalty Account API
 * Get user's loyalty account information
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * GET /api/loyalty/account
 * Get current user's loyalty account
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // TODO: Fetch loyalty account from database
    // For now, return placeholder data
    const account = {
      id: 'loyalty_' + session.user.id,
      userId: session.user.id,
      points: 0,
      lifetimePoints: 0,
      tier: 'BRONZE',
      tierProgress: 0,
      nextTierPoints: 100,
      expiringPoints: 0,
      expiringDate: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: account,
    });
  } catch (error) {
    console.error('Get loyalty account error:', error);
    return NextResponse.json(
      { error: 'Failed to get loyalty account' },
      { status: 500 }
    );
  }
}
