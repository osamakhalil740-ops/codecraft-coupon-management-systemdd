import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { errorResponse, successResponse } from '@/lib/api-response';
import { UnauthorizedError } from '@/lib/errors';

/**

// Force dynamic rendering
export const dynamic = 'force-dynamic';

 * GET /api/notifications
 * Get user's notifications
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return errorResponse(new UnauthorizedError('Please login to continue'));
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return errorResponse(new UnauthorizedError('User not found'));
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');

    const notifications = await prisma.notification.findMany({
      where: {
        userId: user.id,
        ...(unreadOnly ? { isRead: false } : {}),
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    // Get unread count
    const unreadCount = await prisma.notification.count({
      where: {
        userId: user.id,
        isRead: false,
      },
    });

    return successResponse({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    return errorResponse(error as Error);
  }
}

/**
 * POST /api/notifications
 * Create a notification (admin/system only)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return errorResponse(new UnauthorizedError('Please login to continue'));
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== 'SUPER_ADMIN') {
      return errorResponse(new UnauthorizedError('Admin access required'));
    }

    const body = await request.json();
    const { userId, type, title, message, actionUrl, actionText, metadata } = body;

    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        actionUrl,
        actionText,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });

    return successResponse(notification, 'Notification created', 201);
  } catch (error) {
    console.error('Create notification error:', error);
    return errorResponse(error as Error);
  }
}
