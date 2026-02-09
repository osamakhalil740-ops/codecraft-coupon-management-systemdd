import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api-middleware';
import { errorResponse, successResponse } from '@/lib/api-response';
import { prisma } from '@/lib/prisma';

/**

// Force dynamic rendering
export const dynamic = 'force-dynamic';

 * GET /api/users/me - Get current user profile
 * Requires authentication
 */
export async function GET(request: NextRequest) {
  try {
    const authenticatedRequest = await withAuth(request);
    const userId = authenticatedRequest.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        emailVerified: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            stores: true,
            coupons: true,
            reviews: true,
            favorites: true,
          },
        },
      },
    });

    if (!user) {
      return errorResponse('User not found', 404);
    }

    return successResponse(user);
  } catch (error) {
    console.error('Get current user error:', error);
    return errorResponse(error as Error);
  }
}

/**
 * PATCH /api/users/me - Update current user profile
 * Requires authentication
 */
export async function PATCH(request: NextRequest) {
  try {
    const authenticatedRequest = await withAuth(request);
    const userId = authenticatedRequest.user.id;
    const body = await request.json();

    const { name, avatar } = body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(avatar && { avatar }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        emailVerified: true,
        updatedAt: true,
      },
    });

    return successResponse(updatedUser, 'Profile updated successfully');
  } catch (error) {
    console.error('Update user profile error:', error);
    return errorResponse(error as Error);
  }
}
