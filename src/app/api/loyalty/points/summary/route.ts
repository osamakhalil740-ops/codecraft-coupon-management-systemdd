/**

// Force dynamic rendering
export const dynamic = 'force-dynamic';

 * Loyalty Points Summary API
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * GET /api/loyalty/points/summary
 * Get points summary for current user
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

    // TODO: Fetch from database
    const summary = {
      total: 0,
      pending: 0,
      available: 0,
      expiring: 0,
      expiringDate: null,
      earnedThisMonth: 0,
      spentThisMonth: 0,
    };

    return NextResponse.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error('Get points summary error:', error);
    return NextResponse.json(
      { error: 'Failed to get points summary' },
      { status: 500 }
    );
  }
}
