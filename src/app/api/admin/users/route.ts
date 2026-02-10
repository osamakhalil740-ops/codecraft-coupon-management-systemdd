import { NextRequest } from 'next/server';
import { withRole } from '@/lib/api-middleware';
import { errorResponse, paginatedResponse } from '@/lib/api-response';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { getPaginationParams } from '@/lib/utils/pagination';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/users - Get all users (Admin only)
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

    const role = searchParams.get('role') as Role | null;
    const search = searchParams.get('search');

    // Build where clause
    const where: any = {};

    if (role) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get users and total count
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          avatar: true,
          emailVerified: true,
          isActive: true,
          createdAt: true,
          _count: {
            select: {
              stores: true,
              coupons: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return paginatedResponse(users, page, limit, total);
  } catch (error) {
    console.error('Get users error:', error);
    return errorResponse(error as Error);
  }
}
