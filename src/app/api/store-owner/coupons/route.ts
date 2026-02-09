import { NextRequest } from 'next/server';
import { withRole } from '@/lib/api-middleware';
import { errorResponse, successResponse, paginatedResponse } from '@/lib/api-response';
import { prisma } from '@/lib/prisma';
import { Role, CouponStatus, CouponType } from '@prisma/client';
import { getPaginationParams } from '@/lib/utils/pagination';
import { createCouponSchema } from '@/lib/validations/coupon';
import { ValidationError, NotFoundError, ForbiddenError } from '@/lib/errors';
import { slugify } from '@/lib/utils/slugify';

/**

// Force dynamic rendering
export const dynamic = 'force-dynamic';

 * GET /api/store-owner/coupons - Get coupons for user's stores
 * Requires STORE_OWNER role
 */
export async function GET(request: NextRequest) {
  try {
    const authenticatedRequest = await withRole(request, [Role.STORE_OWNER, Role.SUPER_ADMIN]);
    const userId = authenticatedRequest.user.id;

    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = getPaginationParams(
      searchParams.get('page'),
      searchParams.get('limit')
    );

    const storeId = searchParams.get('storeId');
    const status = searchParams.get('status') as CouponStatus | null;

    // Build where clause
    const where: any = {};

    // Get user's stores
    const userStores = await prisma.store.findMany({
      where: { ownerId: userId },
      select: { id: true },
    });

    const storeIds = userStores.map((s) => s.id);

    if (storeId) {
      // Check if user owns this store
      if (!storeIds.includes(storeId)) {
        return errorResponse(new ForbiddenError('You do not own this store'));
      }
      where.storeId = storeId;
    } else {
      where.storeId = { in: storeIds };
    }

    if (status) {
      where.status = status;
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
          category: {
            select: {
              id: true,
              name: true,
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

/**
 * POST /api/store-owner/coupons - Create a new coupon
 * Requires STORE_OWNER role
 */
export async function POST(request: NextRequest) {
  try {
    const authenticatedRequest = await withRole(request, [Role.STORE_OWNER, Role.SUPER_ADMIN]);
    const userId = authenticatedRequest.user.id;

    const body = await request.json();

    // Validate input
    const validationResult = createCouponSchema.safeParse(body);
    if (!validationResult.success) {
      return errorResponse(
        new ValidationError(validationResult.error.errors[0]?.message || 'Invalid input')
      );
    }

    const data = validationResult.data;

    // Check subscription limits
    const { canCreateCoupon } = await import('@/lib/subscription-helpers');
    const canCreate = await canCreateCoupon(userId);
    if (!canCreate) {
      const { getUserLimits } = await import('@/lib/subscription-helpers');
      const limits = await getUserLimits(userId);
      return errorResponse(
        new ForbiddenError(
          `You have reached the maximum number of coupons (${limits.limits.maxCoupons}) for your ${limits.plan} plan. Please upgrade to create more coupons.`
        )
      );
    }

    // Check if user owns the store
    const store = await prisma.store.findUnique({
      where: { id: data.storeId },
    });

    if (!store) {
      return errorResponse(new NotFoundError('Store not found'));
    }

    if (authenticatedRequest.user.role !== Role.SUPER_ADMIN && store.ownerId !== userId) {
      return errorResponse(new ForbiddenError('You do not own this store'));
    }

    // Check if coupon code already exists
    const existingCoupon = await prisma.coupon.findUnique({
      where: { code: data.code },
    });

    if (existingCoupon) {
      return errorResponse(new ValidationError('Coupon code already exists'));
    }

    // Generate slug
    const slug = slugify(`${data.title}-${data.code}`);

    // Create coupon
    const coupon = await prisma.coupon.create({
      data: {
        code: data.code,
        title: data.title,
        description: data.description,
        type: data.type,
        discountValue: data.discountValue,
        minPurchase: data.minPurchase,
        maxDiscount: data.maxDiscount,
        usageLimit: data.usageLimit,
        perUserLimit: data.perUserLimit,
        startDate: data.startDate,
        expiryDate: data.expiryDate,
        storeId: data.storeId,
        categoryId: data.categoryId,
        imageUrl: data.imageUrl,
        thumbnailUrl: data.thumbnailUrl,
        slug,
        createdById: userId,
        status: CouponStatus.PENDING, // Requires admin approval
      },
      include: {
        store: {
          select: {
            id: true,
            name: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return successResponse(coupon, 'Coupon created successfully. Awaiting admin approval.', 201);
  } catch (error) {
    console.error('Create coupon error:', error);
    return errorResponse(error as Error);
  }
}
