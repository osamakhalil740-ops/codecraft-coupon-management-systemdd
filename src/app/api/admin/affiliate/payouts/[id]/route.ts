import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { errorResponse, successResponse } from '@/lib/api-response';
import { UnauthorizedError, ValidationError, NotFoundError } from '@/lib/errors';

/**

// Force dynamic rendering
export const dynamic = 'force-dynamic';

 * POST /api/admin/affiliate/payouts/[id]/approve
 * Approve a payout request (admin only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return errorResponse(new UnauthorizedError('Please login to continue'));
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== 'SUPER_ADMIN') {
      return errorResponse(new UnauthorizedError('Admin access required'));
    }

    const { id } = params;
    const body = await request.json();
    const { action, transactionId, rejectionReason } = body;

    if (!['approve', 'reject'].includes(action)) {
      return errorResponse(new ValidationError('Invalid action'));
    }

    const payoutRequest = await prisma.payoutRequest.findUnique({
      where: { id },
      include: { affiliate: true },
    });

    if (!payoutRequest) {
      return errorResponse(new NotFoundError('Payout request not found'));
    }

    if (payoutRequest.status !== 'PENDING') {
      return errorResponse(
        new ValidationError('Payout request has already been processed')
      );
    }

    if (action === 'approve') {
      if (!transactionId) {
        return errorResponse(new ValidationError('Transaction ID is required'));
      }

      // Approve payout
      const updatedPayout = await prisma.$transaction(async (tx) => {
        const payout = await tx.payoutRequest.update({
          where: { id },
          data: {
            status: 'COMPLETED',
            processedAt: new Date(),
            processedBy: user.id,
            completedAt: new Date(),
            transactionId,
          },
        });

        // Update affiliate total paid out
        await tx.affiliate.update({
          where: { id: payoutRequest.affiliateId },
          data: {
            totalPaidOut: { increment: payoutRequest.amount },
          },
        });

        // Mark conversions as paid out
        await tx.affiliateConversion.updateMany({
          where: {
            affiliateId: payoutRequest.affiliateId,
            isPending: false,
            paidOut: false,
          },
          data: {
            paidOut: true,
            paidOutAt: new Date(),
          },
        });

        return payout;
      });

      return successResponse(updatedPayout, 'Payout approved successfully');
    } else {
      // Reject payout
      const updatedPayout = await prisma.$transaction(async (tx) => {
        const payout = await tx.payoutRequest.update({
          where: { id },
          data: {
            status: 'REJECTED',
            processedAt: new Date(),
            processedBy: user.id,
            rejectedAt: new Date(),
            rejectionReason,
          },
        });

        // Refund amount to available balance
        await tx.affiliate.update({
          where: { id: payoutRequest.affiliateId },
          data: {
            availableBalance: { increment: payoutRequest.amount },
          },
        });

        return payout;
      });

      return successResponse(updatedPayout, 'Payout rejected');
    }
  } catch (error) {
    console.error('Process payout error:', error);
    return errorResponse(error as Error);
  }
}
