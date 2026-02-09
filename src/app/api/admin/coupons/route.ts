import { NextRequest } from 'next/server';
import { withRole } from '@/lib/api-middleware';
import { errorResponse, paginatedResponse } from '@/lib/api-response';
import { prisma } from '@/lib/prisma';
import { Role, CouponStatus } from '@prisma/client';
import { getPaginationParams } from '@/lib/utils/pagination';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/coupons - List all coupons with filters
 * Requires SUPER_ADMIN role
 */
export async function GET(request: NextRequest) {
  try {
    await withRole(request, Role.SUPER_ADMIN);

    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = getPaginationParams(
      searchParams.get('page'),
      searchParams.get('limit')
    );

    const status = searchParams.get('status') as CouponStatus | null;
    const search = searchParams.get('search');
    const storeId = searchParams.get('storeId');

    // Build where clause
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (storeId) {
      where.storeId = storeId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get coupons and total count
    const [coupons, total] = await Promise.all([
      prisma.coupon.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          store: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              usages: true,
              favorites: true,
            },
          },
        },
      }),
      prisma.coupon.count({ where }),
    ]);

    return paginatedResponse(coupons, page, limit, total);
  } catch (error) {
    console.error('Get coupons error:', error);
    return errorResponse(error as Error);
  }
}
