import { NextRequest } from 'next/server';
import { withRole } from '@/lib/api-middleware';
import { errorResponse, successResponse } from '@/lib/api-response';
import { prisma } from '@/lib/prisma';
import { Role, CouponStatus, StoreStatus } from '@prisma/client';

// Force dynamic rendering for all API routes
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/admin/analytics - Get platform analytics
 * Requires SUPER_ADMIN role
 */
export async function GET(request: NextRequest) {
  try {
    await withRole(request, Role.SUPER_ADMIN);

    // Get counts
    const [
      totalUsers,
      totalStores,
      totalCoupons,
      pendingStores,
      pendingCoupons,
      activeStores,
      activeCoupons,
      totalCouponUsages,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.store.count(),
      prisma.coupon.count(),
      prisma.store.count({ where: { status: StoreStatus.PENDING } }),
      prisma.coupon.count({ where: { status: CouponStatus.PENDING } }),
      prisma.store.count({ where: { status: StoreStatus.APPROVED, isActive: true } }),
      prisma.coupon.count({ where: { status: CouponStatus.ACTIVE } }),
      prisma.couponUsage.count(),
    ]);

    // Get recent activity
    const [recentStores, recentCoupons, recentUsers] = await Promise.all([
      prisma.store.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          status: true,
          createdAt: true,
          owner: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.coupon.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          code: true,
          status: true,
          createdAt: true,
          store: {
            select: {
              name: true,
            },
          },
        },
      }),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      }),
    ]);

    // Get user role breakdown
    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: true,
    });

    // Get coupon status breakdown
    const couponsByStatus = await prisma.coupon.groupBy({
      by: ['status'],
      _count: true,
    });

    const analytics = {
      overview: {
        totalUsers,
        totalStores,
        totalCoupons,
        totalCouponUsages,
        pendingStores,
        pendingCoupons,
        activeStores,
        activeCoupons,
      },
      recentActivity: {
        stores: recentStores,
        coupons: recentCoupons,
        users: recentUsers,
      },
      breakdown: {
        usersByRole: usersByRole.reduce((acc, item) => {
          acc[item.role] = item._count;
          return acc;
        }, {} as Record<string, number>),
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
