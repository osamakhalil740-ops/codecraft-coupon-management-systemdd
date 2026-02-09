import { NextRequest } from 'next/server';
import { withRole } from '@/lib/api-middleware';
import { errorResponse, successResponse } from '@/lib/api-response';
import { prisma } from '@/lib/prisma';
import { Role, CouponStatus } from '@prisma/client';
import { NotFoundError, ForbiddenError, ValidationError } from '@/lib/errors';
import { updateCouponSchema } from '@/lib/validations/coupon';

/**

// Force dynamic rendering
export const dynamic = 'force-dynamic';

 * GET /api/store-owner/coupons/[id] - Get coupon details
 * Requires STORE_OWNER role
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authenticatedRequest = await withRole(request, [Role.STORE_OWNER, Role.SUPER_ADMIN]);
    const userId = authenticatedRequest.user.id;
    const couponId = params.id;

    const coupon = await prisma.coupon.findUnique({
      where: { id: couponId },
      include: {
        store: {
          include: {
            owner: {
              select: {
                id: true,
              },
            },
          },
        },
        category: true,
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

    // Check ownership (unless super admin)
    if (
      authenticatedRequest.user.role !== Role.SUPER_ADMIN &&
      coupon.store.owner.id !== userId
    ) {
      return errorResponse(new ForbiddenError('You do not own this coupon'));
    }

    return successResponse(coupon);
  } catch (error) {
    console.error('Get coupon error:', error);
    return errorResponse(error as Error);
  }
}

/**
 * PATCH /api/store-owner/coupons/[id] - Update coupon
 * Requires STORE_OWNER role
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authenticatedRequest = await withRole(request, [Role.STORE_OWNER, Role.SUPER_ADMIN]);
    const userId = authenticatedRequest.user.id;
    const couponId = params.id;

    const body = await request.json();

    // Validate input
    const validationResult = updateCouponSchema.safeParse(body);
    if (!validationResult.success) {
      return errorResponse(
        new ValidationError(validationResult.error.errors[0]?.message || 'Invalid input')
      );
    }

    // Find coupon
    const coupon = await prisma.coupon.findUnique({
      where: { id: couponId },
      include: {
        store: {
          include: {
            owner: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (!coupon) {
      return errorResponse(new NotFoundError('Coupon not found'));
    }

    // Check ownership (unless super admin)
    if (
      authenticatedRequest.user.role !== Role.SUPER_ADMIN &&
      coupon.store.owner.id !== userId
    ) {
      return errorResponse(new ForbiddenError('You do not own this coupon'));
    }

    const data = validationResult.data;

    // Update coupon
    const updatedCoupon = await prisma.coupon.update({
      where: { id: couponId },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.type && { type: data.type }),
        ...(data.discountValue !== undefined && { discountValue: data.discountValue }),
        ...(data.minPurchase !== undefined && { minPurchase: data.minPurchase }),
        ...(data.maxDiscount !== undefined && { maxDiscount: data.maxDiscount }),
        ...(data.usageLimit !== undefined && { usageLimit: data.usageLimit }),
        ...(data.perUserLimit !== undefined && { perUserLimit: data.perUserLimit }),
        ...(data.startDate && { startDate: data.startDate }),
        ...(data.expiryDate && { expiryDate: data.expiryDate }),
        ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
        ...(data.thumbnailUrl !== undefined && { thumbnailUrl: data.thumbnailUrl }),
        // Reset to pending if significant changes
        ...(data.title || data.discountValue !== undefined
          ? { status: CouponStatus.PENDING, approvedAt: null, approvedBy: null }
          : {}),
      },
      include: {
        store: {
          select: {
            id: true,
            name: true,
          },
        },
        category: true,
      },
    });

    return successResponse(updatedCoupon, 'Coupon updated successfully');
  } catch (error) {
    console.error('Update coupon error:', error);
    return errorResponse(error as Error);
  }
}

/**
 * DELETE /api/store-owner/coupons/[id] - Delete coupon
 * Requires STORE_OWNER role
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authenticatedRequest = await withRole(request, [Role.STORE_OWNER, Role.SUPER_ADMIN]);
    const userId = authenticatedRequest.user.id;
    const couponId = params.id;

    // Find coupon
    const coupon = await prisma.coupon.findUnique({
      where: { id: couponId },
      include: {
        store: {
          include: {
            owner: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (!coupon) {
      return errorResponse(new NotFoundError('Coupon not found'));
    }

    // Check ownership (unless super admin)
    if (
      authenticatedRequest.user.role !== Role.SUPER_ADMIN &&
      coupon.store.owner.id !== userId
    ) {
      return errorResponse(new ForbiddenError('You do not own this coupon'));
    }

    // Delete coupon
    await prisma.coupon.delete({
      where: { id: couponId },
    });

    return successResponse(null, 'Coupon deleted successfully');
  } catch (error) {
    console.error('Delete coupon error:', error);
    return errorResponse(error as Error);
  }
}
