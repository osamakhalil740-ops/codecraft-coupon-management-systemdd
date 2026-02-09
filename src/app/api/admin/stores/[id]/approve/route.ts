import { NextRequest } from 'next/server';
import { withRole } from '@/lib/api-middleware';
import { errorResponse, successResponse } from '@/lib/api-response';
import { prisma } from '@/lib/prisma';
import { Role, StoreStatus } from '@prisma/client';
import { NotFoundError } from '@/lib/errors';

/**

// Force dynamic rendering
export const dynamic = 'force-dynamic';

 * POST /api/admin/stores/[id]/approve - Approve a store
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

    // Find store
    const store = await prisma.store.findUnique({
      where: { id: storeId },
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

    if (!store) {
      return errorResponse(new NotFoundError('Store not found'));
    }

    // Update store status
    const updatedStore = await prisma.store.update({
      where: { id: storeId },
      data: {
        status: StoreStatus.APPROVED,
        isVerified: true,
        approvedAt: new Date(),
        approvedBy: adminId,
        rejectedAt: null,
        rejectedBy: null,
        rejectionReason: null,
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

    // TODO: Send email notification to store owner

    return successResponse(updatedStore, 'Store approved successfully');
  } catch (error) {
    console.error('Approve store error:', error);
    return errorResponse(error as Error);
  }
}
