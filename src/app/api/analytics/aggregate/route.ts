import { NextRequest, NextResponse } from 'next/server';
import { scheduleAnalyticsAggregation } from '@/lib/queue';
import { errorResponse, successResponse } from '@/lib/api-response';

/**

// Force dynamic rendering
export const dynamic = 'force-dynamic';

 * POST /api/analytics/aggregate
 * Trigger analytics aggregation (cron job)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return errorResponse(new Error('Unauthorized'), 401);
    }

    const body = await request.json().catch(() => ({}));
    const { couponIds, storeIds, date } = body;

    // Schedule aggregation job
    const job = await scheduleAnalyticsAggregation({
      couponIds,
      storeIds,
      date,
    });

    return successResponse({
      jobId: job.id,
      message: 'Analytics aggregation scheduled',
    });
  } catch (error) {
    console.error('Analytics aggregation trigger error:', error);
    return errorResponse(error as Error);
  }
}
