import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-response';
import { prisma } from '@/lib/prisma';
import { getCacheOrSet } from '@/lib/cache';
import { withRateLimit } from '@/lib/api-middleware';
import { NotFoundError } from '@/lib/errors';
import { CouponStatus } from '@prisma/client';

/**

// Force dynamic rendering
export const dynamic = 'force-dynamic';

 * GET /api/public/coupons/[slug] - Get coupon details by slug
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // Apply rate limiting
    await withRateLimit(request, 100, 60);

    // Use cache with 10 minute TTL
    const data = await getCacheOrSet(
      `coupon:${params.slug}`,
      async () => {
        const coupon = await prisma.coupon.findUnique({
      where: { slug: params.slug },
      include: {
        store: {
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
            _count: {
              select: {
                coupons: true,
                reviews: true,
              },
            },
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            icon: true,
          },
        },
        _count: {
          select: {
            usages: true,
            favorites: true,
          },
        },
      },
    });

    if (!coupon) {
      return errorResponse(new NotFoundError('Coupon not found'));
    }

    // Only show active coupons to public
    if (coupon.status !== CouponStatus.ACTIVE) {
      return errorResponse(new NotFoundError('Coupon not available'));
    }

    // Get related coupons from same store
    const relatedCoupons = await prisma.coupon.findMany({
      where: {
        storeId: coupon.storeId,
        status: CouponStatus.ACTIVE,
        expiryDate: { gte: new Date() },
        NOT: { id: coupon.id },
      },
      take: 4,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        slug: true,
        code: true,
        title: true,
        discountValue: true,
        type: true,
        expiryDate: true,
        imageUrl: true,
      },
    });

        return {
          coupon,
          relatedCoupons,
        };
      },
      { ttl: 600, namespace: 'api', tags: ['coupon', params.slug] }
    );

    return successResponse(data);
  } catch (error) {
    console.error('Get coupon error:', error);
    return errorResponse(error as Error);
  }
}
