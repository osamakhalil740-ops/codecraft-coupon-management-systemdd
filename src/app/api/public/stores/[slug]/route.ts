import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-response';
import { prisma } from '@/lib/prisma';
import { NotFoundError } from '@/lib/errors';
import { StoreStatus, CouponStatus } from '@prisma/client';

/**

// Force dynamic rendering
export const dynamic = 'force-dynamic';

 * GET /api/public/stores/[slug] - Get store profile by slug
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const store = await prisma.store.findUnique({
      where: { slug: params.slug },
      include: {
        country: true,
        city: true,
        district: true,
        categories: {
          select: {
            id: true,
            name: true,
            slug: true,
            icon: true,
          },
        },
        owner: {
          select: {
            id: true,
            name: true,
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

    // Only show approved stores to public
    if (store.status !== StoreStatus.APPROVED) {
      return errorResponse(new NotFoundError('Store not available'));
    }

    // Get store's active coupons
    const coupons = await prisma.coupon.findMany({
      where: {
        storeId: store.id,
        status: CouponStatus.ACTIVE,
        expiryDate: { gte: new Date() },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        slug: true,
        code: true,
        title: true,
        description: true,
        discountValue: true,
        type: true,
        expiryDate: true,
        usageCount: true,
        imageUrl: true,
        _count: {
          select: {
            usages: true,
            favorites: true,
          },
        },
      },
    });

    // Get store reviews (if any)
    const reviews = await prisma.review.findMany({
      where: {
        storeId: store.id,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    // Calculate average rating
    const averageRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    return successResponse({
      store,
      coupons,
      reviews,
      averageRating: Math.round(averageRating * 10) / 10,
    });
  } catch (error) {
    console.error('Get store error:', error);
    return errorResponse(error as Error);
  }
}
