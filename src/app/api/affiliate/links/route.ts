import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { createAffiliateLinkSchema } from '@/lib/validations/affiliate';
import { generateTrackingCode } from '@/lib/utils/affiliate';
import { errorResponse, successResponse } from '@/lib/api-response';
import { UnauthorizedError, ValidationError, NotFoundError } from '@/lib/errors';

/**

// Force dynamic rendering
export const dynamic = 'force-dynamic';

 * GET /api/affiliate/links
 * Get all affiliate links for the current user
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

    const links = await prisma.affiliateLink.findMany({
      where: { affiliateId: user.affiliate.id },
      include: {
        coupon: {
          select: {
            id: true,
            code: true,
            title: true,
            slug: true,
            discountValue: true,
            type: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(links);
  } catch (error) {
    console.error('Get affiliate links error:', error);
    return errorResponse(error as Error);
  }
}

/**
 * POST /api/affiliate/links
 * Create a new affiliate link
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
        new UnauthorizedError('Your affiliate account is not approved yet')
      );
    }

    const body = await request.json();

    // Validate input
    const validationResult = createAffiliateLinkSchema.safeParse(body);
    if (!validationResult.success) {
      return errorResponse(
        new ValidationError(validationResult.error.errors[0]?.message || 'Invalid input')
      );
    }

    const { couponId, customTrackingCode } = validationResult.data;

    // If couponId provided, verify it exists
    if (couponId) {
      const coupon = await prisma.coupon.findUnique({
        where: { id: couponId },
      });

      if (!coupon) {
        return errorResponse(new NotFoundError('Coupon not found'));
      }
    }

    // Generate tracking code
    let trackingCode = customTrackingCode || generateTrackingCode();
    let codeExists = await prisma.affiliateLink.findUnique({
      where: { trackingCode },
    });

    // Ensure uniqueness
    while (codeExists) {
      trackingCode = generateTrackingCode();
      codeExists = await prisma.affiliateLink.findUnique({
        where: { trackingCode },
      });
    }

    // Create affiliate link
    const affiliateLink = await prisma.affiliateLink.create({
      data: {
        affiliateId: user.affiliate.id,
        couponId: couponId || null,
        trackingCode,
      },
      include: {
        coupon: {
          select: {
            id: true,
            code: true,
            title: true,
            slug: true,
          },
        },
      },
    });

    return successResponse(
      {
        ...affiliateLink,
        url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/go/${trackingCode}`,
      },
      'Affiliate link created successfully',
      201
    );
  } catch (error) {
    console.error('Create affiliate link error:', error);
    return errorResponse(error as Error);
  }
}
