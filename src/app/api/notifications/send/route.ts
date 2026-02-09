import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';
import webpush from 'web-push';

// Configure web-push with VAPID keys

// Force dynamic rendering
export const dynamic = 'force-dynamic';

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

/**
 * POST /api/notifications/send
 * Send push notification (Admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Only admins can send notifications
    if (!session?.user?.id || session.user.role !== 'SUPER_ADMIN') {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { userId, title, message, actionUrl, type = 'SYSTEM' } = body;

    if (!title || !message) {
      return errorResponse(new Error('Title and message required'), 400);
    }

    // Create notification in database
    const notification = await prisma.notification.create({
      data: {
        userId: userId || session.user.id,
        type,
        title,
        message,
        actionUrl,
      },
    });

    // Get user's push subscriptions
    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        userId: userId || session.user.id,
        isActive: true,
      },
    });

    // Get user's notification preferences
    const preferences = await prisma.notificationPreference.findUnique({
      where: { userId: userId || session.user.id },
    });

    // Check if notifications are enabled
    if (!preferences?.enabled) {
      return successResponse({
        notification,
        message: 'Notification created but user has disabled notifications',
        sent: 0,
      });
    }

    // Send push notifications
    const results = await Promise.allSettled(
      subscriptions.map(async (subscription) => {
        try {
          const pushSubscription = {
            endpoint: subscription.endpoint,
            keys: {
              auth: subscription.auth,
              p256dh: subscription.p256dh,
            },
          };

          const payload = JSON.stringify({
            title,
            body: message,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png',
            data: {
              url: actionUrl || '/',
              notificationId: notification.id,
            },
          });

          await webpush.sendNotification(pushSubscription, payload);

          // Record successful delivery
          await prisma.notificationDelivery.create({
            data: {
              notificationId: notification.id,
              subscriptionId: subscription.id,
              status: 'sent',
              sentAt: new Date(),
            },
          });

          return { success: true };
        } catch (error: any) {
          console.error('Push send error:', error);

          // Record failed delivery
          await prisma.notificationDelivery.create({
            data: {
              notificationId: notification.id,
              subscriptionId: subscription.id,
              status: 'failed',
              error: error.message,
            },
          });

          // Deactivate subscription if it's expired/invalid
          if (error.statusCode === 410) {
            await prisma.pushSubscription.update({
              where: { id: subscription.id },
              data: { isActive: false },
            });
          }

          return { success: false, error: error.message };
        }
      })
    );

    const sent = results.filter((r) => r.status === 'fulfilled' && (r.value as any).success).length;

    // Update notification
    await prisma.notification.update({
      where: { id: notification.id },
      data: {
        pushSent: sent > 0,
        pushSentAt: sent > 0 ? new Date() : null,
      },
    });

    return successResponse({
      notification,
      sent,
      total: subscriptions.length,
      message: `Push notification sent to ${sent} device(s)`,
    });
  } catch (error) {
    console.error('Send notification error:', error);
    return errorResponse(error as Error);
  }
}
