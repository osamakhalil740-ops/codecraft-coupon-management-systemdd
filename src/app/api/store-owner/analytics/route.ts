import { NextRequest } from 'next/server';
import { withRole } from '@/lib/api-middleware';
import { errorResponse, successResponse } from '@/lib/api-response';
import { prisma } from '@/lib/prisma';
import { Role, CouponStatus } from '@prisma/client';

/**

// Force dynamic rendering
export const dynamic = 'force-dynamic';

 * GET /api/store-owner/analytics - Get store owner analytics
 * Requires STORE_OWNER role
 */
export async function GET(request: NextRequest) {
  try {
    const authenticatedRequest = await withRole(request, [Role.STORE_OWNER, Role.SUPER_ADMIN]);
    const userId = authenticatedRequest.user.id;

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    // Get user's stores
    const userStores = await prisma.store.findMany({
      where: { ownerId: userId },
      select: { id: true },
    });

    const storeIds = userStores.map((s) => s.id);

    // Build where clause
    const couponWhere: any = {
      storeId: storeId || { in: storeIds },
    };

    // Get counts
    const [totalStores, totalCoupons, activeCoupons, pendingCoupons, totalUsages] =
      await Promise.all([
        prisma.store.count({ where: { ownerId: userId } }),
        prisma.coupon.count({ where: { storeId: { in: storeIds } } }),
        prisma.coupon.count({
          where: { storeId: { in: storeIds }, status: CouponStatus.ACTIVE },
        }),
        prisma.coupon.count({
          where: { storeId: { in: storeIds }, status: CouponStatus.PENDING },
        }),
        prisma.couponUsage.count({
          where: {
            coupon: {
              storeId: { in: storeIds },
            },
          },
        }),
      ]);

    // Get top performing coupons
    const topCoupons = await prisma.coupon.findMany({
      where: { storeId: { in: storeIds } },
      orderBy: { usageCount: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        code: true,
        usageCount: true,
        status: true,
        store: {
          select: {
            name: true,
          },
        },
      },
    });

    // Get coupon status breakdown
    const couponsByStatus = await prisma.coupon.groupBy({
      by: ['status'],
      where: { storeId: { in: storeIds } },
      _count: true,
    });

    const analytics = {
      overview: {
        totalStores,
        totalCoupons,
        activeCoupons,
        pendingCoupons,
        totalUsages,
      },
      topCoupons,
      breakdown: {
        couponsByStatus: couponsByStatus.reduce((acc, item) => {
          acc[item.status] = item._count;
          return acc;
        }, {} as Record<string, number>),
      },
    };

    return successResponse(analytics);
  } catch (error) {
    console.error('Get analytics error:', error);
    return errorResponse(error as Error);
  }
}
