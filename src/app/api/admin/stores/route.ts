import { NextRequest } from 'next/server';
import { withRole } from '@/lib/api-middleware';
import { errorResponse, paginatedResponse } from '@/lib/api-response';
import { prisma } from '@/lib/prisma';
import { Role, StoreStatus } from '@prisma/client';
import { getPaginationParams } from '@/lib/utils/pagination';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/stores - List all stores with filters
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

    const status = searchParams.get('status') as StoreStatus | null;
    const search = searchParams.get('search');

    // Build where clause
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get stores and total count
    const [stores, total] = await Promise.all([
      prisma.store.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          country: true,
          city: true,
          _count: {
            select: {
              coupons: true,
              reviews: true,
            },
          },
        },
      }),
      prisma.store.count({ where }),
    ]);

    return paginatedResponse(stores, page, limit, total);
  } catch (error) {
    console.error('Get stores error:', error);
    return errorResponse(error as Error);
  }
}
