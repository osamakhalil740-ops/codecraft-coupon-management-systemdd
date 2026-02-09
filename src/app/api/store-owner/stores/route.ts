import { NextRequest } from 'next/server';
import { withRole } from '@/lib/api-middleware';
import { errorResponse, successResponse } from '@/lib/api-response';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * GET /api/store-owner/stores - Get stores owned by current user
 * Requires STORE_OWNER role
 */
export async function GET(request: NextRequest) {
  try {
    const authenticatedRequest = await withRole(request, [Role.STORE_OWNER, Role.SUPER_ADMIN]);
    const userId = authenticatedRequest.user.id;

    const stores = await prisma.store.findMany({
      where: { ownerId: userId },
      include: {
        country: true,
        city: true,
        categories: true,
        _count: {
          select: {
            coupons: true,
            reviews: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(stores);
  } catch (error) {
    console.error('Get stores error:', error);
    return errorResponse(error as Error);
  }
}
