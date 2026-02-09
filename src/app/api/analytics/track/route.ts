import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import {
  trackCouponView,
  trackCouponCopy,
  trackCouponClick,
  getOrCreateSessionId,
  setSessionCookie,
} from '@/lib/utils/analytics';
import { errorResponse, successResponse } from '@/lib/api-response';
import { ValidationError } from '@/lib/errors';
import { z } from 'zod';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

const trackEventSchema = z.object({
  eventType: z.enum(['view', 'copy', 'click']),
  couponId: z.string(),
  metadata: z.record(z.any()).optional(),
});

/**
 * POST /api/analytics/track
 * Track analytics events (view, copy, click)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = trackEventSchema.safeParse(body);
    if (!validationResult.success) {
      return errorResponse(
        new ValidationError(validationResult.error.errors[0]?.message || 'Invalid input')
      );
    }

    const { eventType, couponId, metadata } = validationResult.data;

    // Verify coupon exists
    const coupon = await prisma.coupon.findUnique({
      where: { id: couponId },
      select: { id: true, storeId: true, slug: true },
    });

    if (!coupon) {
      return errorResponse(new ValidationError('Coupon not found'));
    }

    // Get or create session ID
    const cookieStore = cookies();
    const sessionId = getOrCreateSessionId(cookieStore);

    // Track event in Redis
    switch (eventType) {
      case 'view':
        await trackCouponView(couponId, sessionId, coupon.storeId);
        break;
      case 'copy':
        await trackCouponCopy(couponId, sessionId, coupon.storeId);
        break;
      case 'click':
        await trackCouponClick(couponId, sessionId, coupon.storeId);
        break;
    }

    // Store event in database for detailed analytics (async, don't await)
    storeAnalyticsEvent(eventType, couponId, coupon.storeId, sessionId, request, metadata);

    // Create response
    const response = NextResponse.json(
      successResponse({ tracked: true, eventType })
    );

    // Set session cookie
    const sessionCookie = setSessionCookie(sessionId);
    response.cookies.set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.options
    );

    return response;
  } catch (error) {
    console.error('Analytics tracking error:', error);
    return errorResponse(error as Error);
  }
}

/**
 * Store analytics event in database (async)
 */
async function storeAnalyticsEvent(
  eventType: string,
  couponId: string,
  storeId: string,
  sessionId: string,
  request: NextRequest,
  metadata?: Record<string, any>
) {
  try {
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const referrer = request.headers.get('referer') || null;

    // Map event type to enum
    const eventTypeMap: Record<string, string> = {
      view: 'VIEW',
      copy: 'COPY',
      click: 'CLICK',
    };

    await prisma.analyticsEvent.create({
      data: {
        eventType: eventTypeMap[eventType] as any,
        couponId,
        storeId,
        sessionId,
        ipAddress,
        userAgent,
        referrer,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
  } catch (error) {
    console.error('Failed to store analytics event:', error);
    // Don't throw - this is async logging
  }
}
