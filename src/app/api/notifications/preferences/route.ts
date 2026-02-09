import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';

/**

// Force dynamic rendering
export const dynamic = 'force-dynamic';

 * GET /api/notifications/preferences
 * Get notification preferences
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    let preferences = await prisma.notificationPreference.findUnique({
      where: { userId: session.user.id },
    });

    // Create default preferences if they don't exist
    if (!preferences) {
      preferences = await prisma.notificationPreference.create({
        data: {
          userId: session.user.id,
          enabled: true,
          channelCoupons: true,
          channelStores: true,
          channelAffiliate: true,
          channelSystem: true,
          channelMarketing: false,
          sound: true,
          vibration: true,
        },
      });
    }

    return successResponse({ preferences });
  } catch (error) {
    console.error('Get preferences error:', error);
    return errorResponse(error as Error);
  }
}

/**
 * PATCH /api/notifications/preferences
 * Update notification preferences
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await request.json();

    const preferences = await prisma.notificationPreference.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        ...body,
      },
      update: body,
    });

    return successResponse({
      preferences,
      message: 'Notification preferences updated',
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    return errorResponse(error as Error);
  }
}
