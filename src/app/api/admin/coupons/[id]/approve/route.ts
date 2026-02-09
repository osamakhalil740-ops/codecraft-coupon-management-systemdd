import { NextRequest } from 'next/server';
import { withRole } from '@/lib/api-middleware';
import { errorResponse, successResponse } from '@/lib/api-response';
import { prisma } from '@/lib/prisma';
import { Role, CouponStatus } from '@prisma/client';
import { NotFoundError } from '@/lib/errors';

/**

// Force dynamic rendering
export const dynamic = 'force-dynamic';

 * POST /api/admin/coupons/[id]/approve - Approve a coupon
 * Requires SUPER_ADMIN role
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authenticatedRequest = await withRole(request, Role.SUPER_ADMIN);
    const adminId = authenticatedRequest.user.id;
    const couponId = params.id;

    // Find coupon
    const coupon = await prisma.coupon.findUnique({
      where: { id: couponId },
      include: {
        store: true,
      },
    });

    if (!coupon) {
      return errorResponse(new NotFoundError('Coupon not found'));
    }

    // Determine status based on dates
    const now = new Date();
    let newStatus = CouponStatus.APPROVED;

    if (now >= coupon.startDate && now < coupon.expiryDate) {
      newStatus = CouponStatus.ACTIVE;
    } else if (now >= coupon.expiryDate) {
      newStatus = CouponStatus.EXPIRED;
    }

    // Update coupon status
    const updatedCoupon = await prisma.coupon.update({
      where: { id: couponId },
      data: {
        status: newStatus,
        approvedAt: new Date(),
        approvedBy: adminId,
        rejectedAt: null,
        rejectedBy: null,
        rejectionReason: null,
      },
      include: {
        store: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // TODO: Send email notification to store owner

    return successResponse(updatedCoupon, 'Coupon approved successfully');
  } catch (error) {
    console.error('Approve coupon error:', error);
    return errorResponse(error as Error);
  }
}
