import { NextRequest } from 'next/server';
import { withRole } from '@/lib/api-middleware';
import { errorResponse, successResponse } from '@/lib/api-response';
import { prisma } from '@/lib/prisma';
import { Role, CouponStatus } from '@prisma/client';
import { NotFoundError, ValidationError } from '@/lib/errors';

/**

// Force dynamic rendering
export const dynamic = 'force-dynamic';

 * POST /api/admin/coupons/[id]/reject - Reject a coupon
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

    const body = await request.json();
    const { reason } = body;

    if (!reason) {
      return errorResponse(new ValidationError('Rejection reason is required'));
    }

    // Find coupon
    const coupon = await prisma.coupon.findUnique({
      where: { id: couponId },
    });

    if (!coupon) {
      return errorResponse(new NotFoundError('Coupon not found'));
    }

    // Update coupon status
    const updatedCoupon = await prisma.coupon.update({
      where: { id: couponId },
      data: {
        status: CouponStatus.REJECTED,
        rejectedAt: new Date(),
        rejectedBy: adminId,
        rejectionReason: reason,
        approvedAt: null,
        approvedBy: null,
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

    // TODO: Send email notification to store owner with reason

    return successResponse(updatedCoupon, 'Coupon rejected');
  } catch (error) {
    console.error('Reject coupon error:', error);
    return errorResponse(error as Error);
  }
}
