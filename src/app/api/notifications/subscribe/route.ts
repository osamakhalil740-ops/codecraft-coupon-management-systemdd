import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';

/**

// Force dynamic rendering
export const dynamic = 'force-dynamic';

 * POST /api/notifications/subscribe
 * Subscribe to push notifications
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { endpoint, keys, platform = 'web', userAgent } = body;

    if (!endpoint || !keys?.auth || !keys?.p256dh) {
      return errorResponse(new Error('Invalid subscription data'), 400);
    }

    // Check if subscription already exists
    const existing = await prisma.pushSubscription.findUnique({
      where: { endpoint },
    });

    let subscription;

    if (existing) {
      // Update existing subscription
      subscription = await prisma.pushSubscription.update({
        where: { endpoint },
        data: {
          userId: session.user.id,
          auth: keys.auth,
          p256dh: keys.p256dh,
          platform,
          userAgent: userAgent || existing.userAgent,
          isActive: true,
          lastUsedAt: new Date(),
        },
      });
    } else {
      // Create new subscription
      subscription = await prisma.pushSubscription.create({
        data: {
          userId: session.user.id,
          endpoint,
          auth: keys.auth,
          p256dh: keys.p256dh,
          platform,
          userAgent,
          isActive: true,
        },
      });
    }

    return successResponse({
      subscription,
      message: 'Successfully subscribed to push notifications',
    });
  } catch (error) {
    console.error('Subscribe error:', error);
    return errorResponse(error as Error);
  }
}

/**
 * DELETE /api/notifications/subscribe
 * Unsubscribe from push notifications
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { endpoint } = body;

    if (!endpoint) {
      return errorResponse(new Error('Endpoint required'), 400);
    }

    // Deactivate subscription
    await prisma.pushSubscription.updateMany({
      where: {
        userId: session.user.id,
        endpoint,
      },
      data: {
        isActive: false,
      },
    });

    return successResponse({
      message: 'Successfully unsubscribed from push notifications',
    });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return errorResponse(error as Error);
  }
}
