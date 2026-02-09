import { NextRequest } from 'next/server';
import { withRole } from '@/lib/api-middleware';
import { errorResponse, successResponse } from '@/lib/api-response';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { NotFoundError, ForbiddenError } from '@/lib/errors';

/**

// Force dynamic rendering
export const dynamic = 'force-dynamic';

 * GET /api/store-owner/stores/[id] - Get store details
 * Requires STORE_OWNER role
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authenticatedRequest = await withRole(request, [Role.STORE_OWNER, Role.SUPER_ADMIN]);
    const userId = authenticatedRequest.user.id;
    const storeId = params.id;

    const store = await prisma.store.findUnique({
      where: { id: storeId },
      include: {
        country: true,
        city: true,
        district: true,
        categories: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            coupons: true,
            reviews: true,
          },
        },
      },
    });

    if (!store) {
      return errorResponse(new NotFoundError('Store not found'));
    }

    // Check ownership (unless super admin)
    if (authenticatedRequest.user.role !== Role.SUPER_ADMIN && store.ownerId !== userId) {
      return errorResponse(new ForbiddenError('You do not own this store'));
    }

    return successResponse(store);
  } catch (error) {
    console.error('Get store error:', error);
    return errorResponse(error as Error);
  }
}

/**
 * PATCH /api/store-owner/stores/[id] - Update store
 * Requires STORE_OWNER role
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authenticatedRequest = await withRole(request, [Role.STORE_OWNER, Role.SUPER_ADMIN]);
    const userId = authenticatedRequest.user.id;
    const storeId = params.id;

    const body = await request.json();

    // Find store
    const store = await prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      return errorResponse(new NotFoundError('Store not found'));
    }

    // Check ownership (unless super admin)
    if (authenticatedRequest.user.role !== Role.SUPER_ADMIN && store.ownerId !== userId) {
      return errorResponse(new ForbiddenError('You do not own this store'));
    }

    // Update store
    const updatedStore = await prisma.store.update({
      where: { id: storeId },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.logo && { logo: body.logo }),
        ...(body.coverImage && { coverImage: body.coverImage }),
        ...(body.website && { website: body.website }),
        ...(body.phone && { phone: body.phone }),
        ...(body.email && { email: body.email }),
        ...(body.address && { address: body.address }),
      },
      include: {
        country: true,
        city: true,
        categories: true,
      },
    });

    return successResponse(updatedStore, 'Store updated successfully');
  } catch (error) {
    console.error('Update store error:', error);
    return errorResponse(error as Error);
  }
}
