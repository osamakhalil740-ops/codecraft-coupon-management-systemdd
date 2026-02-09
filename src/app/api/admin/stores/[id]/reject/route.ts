import { NextRequest } from 'next/server';
import { withRole } from '@/lib/api-middleware';
import { errorResponse, successResponse } from '@/lib/api-response';
import { prisma } from '@/lib/prisma';
import { Role, StoreStatus } from '@prisma/client';
import { NotFoundError, ValidationError } from '@/lib/errors';

/**

// Force dynamic rendering
export const dynamic = 'force-dynamic';

 * POST /api/admin/stores/[id]/reject - Reject a store
 * Requires SUPER_ADMIN role
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authenticatedRequest = await withRole(request, Role.SUPER_ADMIN);
    const adminId = authenticatedRequest.user.id;
    const storeId = params.id;

    const body = await request.json();
    const { reason } = body;

    if (!reason) {
      return errorResponse(new ValidationError('Rejection reason is required'));
    }

    // Find store
    const store = await prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      return errorResponse(new NotFoundError('Store not found'));
    }

    // Update store status
    const updatedStore = await prisma.store.update({
      where: { id: storeId },
      data: {
        status: StoreStatus.REJECTED,
        isVerified: false,
        rejectedAt: new Date(),
        rejectedBy: adminId,
        rejectionReason: reason,
        approvedAt: null,
        approvedBy: null,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // TODO: Send email notification to store owner with reason

    return successResponse(updatedStore, 'Store rejected');
  } catch (error) {
    console.error('Reject store error:', error);
    return errorResponse(error as Error);
  }
}
