/**

// Force dynamic rendering
export const dynamic = 'force-dynamic';

 * ML Behavior Tracking API
 * Track user behavior for ML model training
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * POST /api/ml/behavior
 * Track user behavior event
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
    const { userId, eventType, couponId, storeId, categoryId, query, metadata } = body;

    // TODO: Store behavior event for ML training
    // For now, just log it
    console.log('Behavior tracked:', {
      userId,
      eventType,
      couponId,
      storeId,
      categoryId,
      query,
      metadata,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Behavior tracked successfully',
    });
  } catch (error) {
    console.error('Behavior tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to track behavior' },
      { status: 500 }
    );
  }
}
