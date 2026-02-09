import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';
import webpush from 'web-push';

// Configure web-push

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
 * POST /api/admin/notifications/send
 * Send push notifications to users (Admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Only admins can send bulk notifications
    if (!session?.user?.id || session.user.role !== 'SUPER_ADMIN') {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      message,
      actionUrl,
      type = 'SYSTEM',
      targetAudience = 'all', // all, users, store_owners, affiliates
      userIds, // Specific user IDs
    } = body;

    if (!title || !message) {
      return errorResponse(new Error('Title and message required'), 400);
    }

    // Determine target users
    let targetUsers: string[] = [];

    if (userIds && Array.isArray(userIds)) {
      targetUsers = userIds;
    } else {
      // Query users based on target audience
      const whereClause: any = { isActive: true };

      if (targetAudience === 'store_owners') {
        whereClause.role = 'STORE_OWNER';
      } else if (targetAudience === 'affiliates') {
        whereClause.affiliate = { isNot: null };
      } else if (targetAudience === 'users') {
        whereClause.role = 'USER';
      }

      const users = await prisma.user.findMany({
        where: whereClause,
        select: { id: true },
      });

      targetUsers = users.map((u) => u.id);
    }

    if (targetUsers.length === 0) {
      return errorResponse(new Error('No target users found'), 400);
    }

    // Create notifications and send push
    let sentCount = 0;
    let failedCount = 0;

    for (const userId of targetUsers) {
      try {
        // Create notification in database
        const notification = await prisma.notification.create({
          data: {
            userId,
            type,
            title,
            message,
            actionUrl,
          },
        });

        // Get user's active push subscriptions
        const subscriptions = await prisma.pushSubscription.findMany({
          where: {
            userId,
            isActive: true,
          },
        });

        // Check user preferences
        const preferences = await prisma.notificationPreference.findUnique({
          where: { userId },
        });

        if (!preferences?.enabled) {
          continue; // Skip if notifications disabled
        }

        // Send to all user's devices
        for (const subscription of subscriptions) {
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
              vibrate: preferences.vibration !== false ? [200, 100, 200] : undefined,
              silent: !preferences.sound,
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

            sentCount++;
          } catch (error: any) {
            console.error('Push send error:', error);
            failedCount++;

            // Record failed delivery
            await prisma.notificationDelivery.create({
              data: {
                notificationId: notification.id,
                subscriptionId: subscription.id,
                status: 'failed',
                error: error.message,
              },
            });

            // Deactivate expired subscriptions
            if (error.statusCode === 410) {
              await prisma.pushSubscription.update({
                where: { id: subscription.id },
                data: { isActive: false },
              });
            }
          }
        }

        // Update notification
        await prisma.notification.update({
          where: { id: notification.id },
          data: {
            pushSent: sentCount > 0,
            pushSentAt: sentCount > 0 ? new Date() : null,
          },
        });
      } catch (error) {
        console.error(`Error sending to user ${userId}:`, error);
        failedCount++;
      }
    }

    return successResponse({
      message: `Notifications sent`,
      stats: {
        targetUsers: targetUsers.length,
        sent: sentCount,
        failed: failedCount,
      },
    });
  } catch (error) {
    console.error('Send bulk notifications error:', error);
    return errorResponse(error as Error);
  }
}
