/**

// Force dynamic rendering
export const dynamic = 'force-dynamic';

 * ML User Preferences API
 * Get and update user preferences for recommendations
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * GET /api/ml/preferences/[userId]
 * Get user preferences
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { userId } = params;

    // TODO: Fetch user preferences from database
    // For now, return default preferences
    const preferences = {
      userId,
      preferredCategories: [],
      preferredStores: [],
      priceRange: { min: 0, max: 1000 },
      discountPreference: 'any',
      location: { countryId: '' },
      activityLevel: 'low',
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    console.error('Get preferences error:', error);
    return NextResponse.json(
      { error: 'Failed to get preferences' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ml/preferences/[userId]
 * Update user preferences
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { userId } = params;
    const body = await request.json();

    // TODO: Update user preferences in database
    console.log('Updating preferences for user:', userId, body);

    return NextResponse.json({
      success: true,
      message: 'Preferences updated successfully',
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}
