import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { payoutRequestSchema } from '@/lib/validations/affiliate';
import { errorResponse, successResponse } from '@/lib/api-response';
import { UnauthorizedError, ValidationError, NotFoundError } from '@/lib/errors';

/**

// Force dynamic rendering
export const dynamic = 'force-dynamic';

 * GET /api/affiliate/payouts
 * Get all payout requests for the current affiliate
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return errorResponse(new UnauthorizedError('Please login to continue'));
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { affiliate: true },
    });

    if (!user?.affiliate) {
      return errorResponse(new NotFoundError('Affiliate account not found'));
    }

    const payouts = await prisma.payoutRequest.findMany({
      where: { affiliateId: user.affiliate.id },
      orderBy: { requestedAt: 'desc' },
    });

    return successResponse(payouts);
  } catch (error) {
    console.error('Get payout requests error:', error);
    return errorResponse(error as Error);
  }
}

/**
 * POST /api/affiliate/payouts
 * Request a payout
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return errorResponse(new UnauthorizedError('Please login to continue'));
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { affiliate: true },
    });

    if (!user?.affiliate) {
      return errorResponse(new NotFoundError('Affiliate account not found'));
    }

    if (user.affiliate.status !== 'APPROVED') {
      return errorResponse(
        new UnauthorizedError('Your affiliate account is not approved')
      );
    }

    const body = await request.json();

    // Validate input
    const validationResult = payoutRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return errorResponse(
        new ValidationError(validationResult.error.errors[0]?.message || 'Invalid input')
      );
    }

    const { amount, paymentMethod, paymentEmail, paymentDetails } = validationResult.data;

    // Check if affiliate has sufficient available balance
    if (user.affiliate.availableBalance < amount) {
      return errorResponse(
        new ValidationError(
          `Insufficient available balance. Available: $${user.affiliate.availableBalance.toFixed(2)}`
        )
      );
    }

    // Create payout request
    const payoutRequest = await prisma.$transaction(async (tx) => {
      const payout = await tx.payoutRequest.create({
        data: {
          affiliateId: user.affiliate!.id,
          amount,
          paymentMethod,
          paymentEmail: paymentEmail || user.affiliate!.paymentEmail,
          paymentDetails,
          status: 'PENDING',
        },
      });

      // Deduct from available balance (will be refunded if rejected)
      await tx.affiliate.update({
        where: { id: user.affiliate!.id },
        data: {
          availableBalance: { decrement: amount },
        },
      });

      return payout;
    });

    return successResponse(
      payoutRequest,
      'Payout request submitted successfully. It will be processed within 5-7 business days.',
      201
    );
  } catch (error) {
    console.error('Request payout error:', error);
    return errorResponse(error as Error);
  }
}
