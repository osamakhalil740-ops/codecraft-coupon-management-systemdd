// Vercel deployment fix - ensures clean build without cache issues
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { trackConversionSchema } from '@/lib/validations/affiliate';
import { calculateCommission } from '@/lib/utils/affiliate';
import { errorResponse, successResponse } from '@/lib/api-response';
import { ValidationError, NotFoundError } from '@/lib/errors';

/**

// Force dynamic rendering
export const dynamic = 'force-dynamic';

 * POST /api/affiliate/conversions
 * Track an affiliate conversion (internal API - called when user makes a purchase)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validationResult = trackConversionSchema.safeParse(body);
    if (!validationResult.success) {
      return errorResponse(
        new ValidationError(validationResult.error.errors[0]?.message || 'Invalid input')
      );
    }

    const { affiliateLinkId, couponId, orderValue, userId } = validationResult.data;

    // Find affiliate link
    const affiliateLink = await prisma.affiliateLink.findUnique({
      where: { id: affiliateLinkId },
      include: {
        affiliate: true,
      },
    });

    if (!affiliateLink) {
      return errorResponse(new NotFoundError('Affiliate link not found'));
    }

    // Get commission rate
    const commissionRate = affiliateLink.affiliate.defaultCommissionRate;
    const commissionAmount = orderValue ? calculateCommission(orderValue, commissionRate) : 0;

    // Create conversion record
    const conversion = await prisma.$transaction(async (tx) => {
      const newConversion = await tx.affiliateConversion.create({
        data: {
          affiliateLinkId,
          affiliateId: affiliateLink.affiliateId,
          couponId: couponId || null,
          userId: userId || null,
          orderValue: orderValue || null,
          commissionRate,
          commissionAmount,
          isPending: true,
        },
      });

      // Update affiliate link stats
      await tx.affiliateLink.update({
        where: { id: affiliateLinkId },
        data: {
          totalConversions: { increment: 1 },
          totalEarnings: { increment: commissionAmount },
        },
      });

      // Update affiliate pending balance
      await tx.affiliate.update({
        where: { id: affiliateLink.affiliateId },
        data: {
          pendingBalance: { increment: commissionAmount },
          totalEarnings: { increment: commissionAmount },
        },
      });

      return newConversion;
    });

    return successResponse(conversion, 'Conversion tracked successfully', 201);
  } catch (error) {
    console.error('Track conversion error:', error);
    return errorResponse(error as Error);
  }
}
