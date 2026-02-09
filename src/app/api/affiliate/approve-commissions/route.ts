import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { shouldApproveCommission } from '@/lib/utils/affiliate';
import { errorResponse, successResponse } from '@/lib/api-response';

/**

// Force dynamic rendering
export const dynamic = 'force-dynamic';

 * POST /api/affiliate/approve-commissions
 * Cron job to approve pending commissions after 30 days
 * This moves commissions from pending to available balance
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret (optional security)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return errorResponse(new Error('Unauthorized'), 401);
    }

    // Find all pending commissions that are ready to be approved (30+ days old)
    const pendingConversions = await prisma.affiliateConversion.findMany({
      where: {
        isPending: true,
        paidOut: false,
      },
    });

    const conversionsToApprove = pendingConversions.filter((conversion) =>
      shouldApproveCommission(conversion.convertedAt)
    );

    if (conversionsToApprove.length === 0) {
      return successResponse({ approvedCount: 0 }, 'No commissions ready for approval');
    }

    // Group by affiliate for batch updates
    const affiliateUpdates = new Map<string, number>();
    
    conversionsToApprove.forEach((conversion) => {
      const current = affiliateUpdates.get(conversion.affiliateId) || 0;
      affiliateUpdates.set(conversion.affiliateId, current + conversion.commissionAmount);
    });

    // Update conversions and affiliate balances in transaction
    await prisma.$transaction(async (tx) => {
      // Mark conversions as approved
      await tx.affiliateConversion.updateMany({
        where: {
          id: { in: conversionsToApprove.map((c) => c.id) },
        },
        data: {
          isPending: false,
          approvedAt: new Date(),
        },
      });

      // Update affiliate balances
      for (const [affiliateId, amount] of affiliateUpdates) {
        await tx.affiliate.update({
          where: { id: affiliateId },
          data: {
            pendingBalance: { decrement: amount },
            availableBalance: { increment: amount },
          },
        });
      }
    });

    return successResponse(
      {
        approvedCount: conversionsToApprove.length,
        totalAmount: Array.from(affiliateUpdates.values()).reduce((sum, val) => sum + val, 0),
      },
      'Commissions approved successfully'
    );
  } catch (error) {
    console.error('Approve commissions error:', error);
    return errorResponse(error as Error);
  }
}
