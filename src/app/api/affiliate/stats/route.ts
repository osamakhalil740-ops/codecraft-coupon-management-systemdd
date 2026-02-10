import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { calculateCTR } from '@/lib/utils/affiliate';
import { errorResponse, successResponse } from '@/lib/api-response';
import { UnauthorizedError, NotFoundError } from '@/lib/errors';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * GET /api/affiliate/stats
 * Get affiliate statistics for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return errorResponse(new UnauthorizedError('Please login to continue'));
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { 
        affiliate: {
          include: {
            affiliateLinks: true,
            clicks: true,
            conversions: true,
          },
        },
      },
    });

    if (!user?.affiliate) {
      return errorResponse(new NotFoundError('Affiliate account not found'));
    }

    const { affiliate } = user;

    // Calculate stats
    const totalClicks = affiliate.affiliateLinks.reduce((sum, link) => sum + link.totalClicks, 0);
    const totalConversions = affiliate.affiliateLinks.reduce((sum, link) => sum + link.totalConversions, 0);
    const ctr = calculateCTR(totalClicks, totalConversions);

    // Get recent conversions
    const recentConversions = await prisma.affiliateConversion.findMany({
      where: { affiliateId: affiliate.id },
      include: {
        coupon: {
          select: {
            code: true,
            title: true,
          },
        },
      },
      orderBy: { convertedAt: 'desc' },
      take: 10,
    });

    // Get top performing links
    const topLinks = await prisma.affiliateLink.findMany({
      where: { affiliateId: affiliate.id },
      include: {
        coupon: {
          select: {
            code: true,
            title: true,
            slug: true,
          },
        },
      },
      orderBy: { totalEarnings: 'desc' },
      take: 5,
    });

    const stats = {
      affiliate: {
        id: affiliate.id,
        affiliateCode: affiliate.affiliateCode,
        status: affiliate.status,
        defaultCommissionRate: affiliate.defaultCommissionRate,
      },
      balance: {
        pending: affiliate.pendingBalance,
        available: affiliate.availableBalance,
        totalEarnings: affiliate.totalEarnings,
        totalPaidOut: affiliate.totalPaidOut,
      },
      performance: {
        totalClicks,
        totalConversions,
        ctr,
        totalLinks: affiliate.affiliateLinks.length,
      },
      recentConversions,
      topLinks: topLinks.map(link => ({
        ...link,
        url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/go/${link.trackingCode}`,
        ctr: calculateCTR(link.totalClicks, link.totalConversions),
      })),
    };

    return successResponse(stats);
  } catch (error) {
    console.error('Get affiliate stats error:', error);
    return errorResponse(error as Error);
  }
}
