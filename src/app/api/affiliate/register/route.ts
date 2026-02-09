import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { affiliateRegistrationSchema } from '@/lib/validations/affiliate';
import { generateAffiliateCode } from '@/lib/utils/affiliate';
import { errorResponse, successResponse } from '@/lib/api-response';
import { UnauthorizedError, ValidationError, ConflictError } from '@/lib/errors';

/**

// Force dynamic rendering
export const dynamic = 'force-dynamic';

 * POST /api/affiliate/register
 * Register as an affiliate
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

    if (!user) {
      return errorResponse(new UnauthorizedError('User not found'));
    }

    // Check if user is already an affiliate
    if (user.affiliate) {
      return errorResponse(new ConflictError('You are already registered as an affiliate'));
    }

    const body = await request.json();

    // Validate input
    const validationResult = affiliateRegistrationSchema.safeParse(body);
    if (!validationResult.success) {
      return errorResponse(
        new ValidationError(validationResult.error.errors[0]?.message || 'Invalid input')
      );
    }

    const { paymentEmail, paymentMethod, bankDetails } = validationResult.data;

    // Generate unique affiliate code
    let affiliateCode = generateAffiliateCode();
    let codeExists = await prisma.affiliate.findUnique({
      where: { affiliateCode },
    });

    // Ensure uniqueness
    while (codeExists) {
      affiliateCode = generateAffiliateCode();
      codeExists = await prisma.affiliate.findUnique({
        where: { affiliateCode },
      });
    }

    // Create affiliate record
    const affiliate = await prisma.affiliate.create({
      data: {
        userId: user.id,
        affiliateCode,
        paymentEmail,
        paymentMethod,
        bankDetails,
        status: 'APPROVED', // Auto-approve for now, can change to PENDING for manual approval
        approvedAt: new Date(),
      },
    });

    return successResponse(
      {
        id: affiliate.id,
        affiliateCode: affiliate.affiliateCode,
        status: affiliate.status,
        defaultCommissionRate: affiliate.defaultCommissionRate,
      },
      'Successfully registered as an affiliate! You can now start creating affiliate links.',
      201
    );
  } catch (error) {
    console.error('Affiliate registration error:', error);
    return errorResponse(error as Error);
  }
}
