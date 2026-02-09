import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCouponAnalyticsSummary } from '@/lib/utils/analytics';
import { errorResponse, successResponse } from '@/lib/api-response';
import { NotFoundError } from '@/lib/errors';

/**

// Force dynamic rendering
export const dynamic = 'force-dynamic';

 * GET /api/analytics/[couponId]
 * Get real-time analytics for a specific coupon
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { couponId: string } }
) {
  try {
    const { couponId } = params;
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '7'; // days

    // Verify coupon exists
    const coupon = await prisma.coupon.findUnique({
      where: { id: couponId },
      select: {
        id: true,
        code: true,
        title: true,
        storeId: true,
      },
    });

    if (!coupon) {
      return errorResponse(new NotFoundError('Coupon not found'));
    }

    // Get real-time analytics from Redis
    const realtimeAnalytics = await getCouponAnalyticsSummary(couponId);

    // Get historical analytics from database
    const days = parseInt(range);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const historicalAnalytics = await prisma.couponAnalytics.findMany({
      where: {
        couponId,
        date: {
          gte: startDate,
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Calculate totals from historical data
    const historical = historicalAnalytics.reduce(
      (acc, record) => ({
        views: acc.views + record.views,
        copies: acc.copies + record.copies,
        clicks: acc.clicks + record.clicks,
        usages: acc.usages + record.usages,
        shares: acc.shares + record.shares,
      }),
      { views: 0, copies: 0, clicks: 0, usages: 0, shares: 0 }
    );

    // Combine real-time and historical
    const combined = {
      views: realtimeAnalytics.views + historical.views,
      copies: realtimeAnalytics.copies + historical.copies,
      clicks: realtimeAnalytics.clicks + historical.clicks,
      usages: historical.usages,
      shares: historical.shares,
      uniqueViews: realtimeAnalytics.uniqueViews,
      uniqueCopies: realtimeAnalytics.uniqueCopies,
      uniqueClicks: realtimeAnalytics.uniqueClicks,
      copyRate: realtimeAnalytics.copyRate,
      clickRate: realtimeAnalytics.clickRate,
      clickThroughRate: realtimeAnalytics.clickThroughRate,
    };

    return successResponse({
      coupon: {
        id: coupon.id,
        code: coupon.code,
        title: coupon.title,
      },
      realtime: realtimeAnalytics,
      historical: historicalAnalytics,
      summary: combined,
      range: days,
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    return errorResponse(error as Error);
  }
}
