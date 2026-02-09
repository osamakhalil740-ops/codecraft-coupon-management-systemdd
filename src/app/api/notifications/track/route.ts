import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';

/**

// Force dynamic rendering
export const dynamic = 'force-dynamic';

 * POST /api/notifications/track
 * Track notification interactions (click, dismiss)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { notificationId, action } = body;

    if (!notificationId) {
      return errorResponse(new Error('Notification ID required'), 400);
    }

    // Find the delivery record
    const delivery = await prisma.notificationDelivery.findFirst({
      where: { notificationId },
      orderBy: { createdAt: 'desc' },
    });

    if (delivery) {
      const updateData: any = {};

      if (action === 'click' || action === 'open') {
        updateData.status = 'clicked';
        updateData.clickedAt = new Date();
      } else if (action === 'close' || action === 'dismiss') {
        updateData.status = 'dismissed';
        updateData.dismissedAt = new Date();
      }

      await prisma.notificationDelivery.update({
        where: { id: delivery.id },
        data: updateData,
      });
    }

    return successResponse({ message: 'Tracked' });
  } catch (error) {
    console.error('Track notification error:', error);
    return errorResponse(error as Error);
  }
}
