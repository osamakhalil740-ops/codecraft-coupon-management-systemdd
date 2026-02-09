/**

// Force dynamic rendering
export const dynamic = 'force-dynamic';

 * ML Recommendations API
 * Returns personalized coupon recommendations
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * GET /api/ml/recommendations
 * Get personalized recommendations for a user
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { userId, context, limit = 10 } = body;

    // TODO: Implement ML-based recommendations
    // For now, return empty array with structure ready
    const recommendations = [];

    return NextResponse.json({
      success: true,
      data: {
        recommendations,
        userId,
        context,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('ML recommendations error:', error);
    return NextResponse.json(
      { error: 'Failed to get recommendations' },
      { status: 500 }
    );
  }
}
