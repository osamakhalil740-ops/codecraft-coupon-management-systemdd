import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateCookieId, createAffiliateCookieValue, getAttributionCookieExpiry } from '@/lib/utils/affiliate';
import { errorResponse } from '@/lib/api-response';
import { NotFoundError } from '@/lib/errors';

/**

// Force dynamic rendering
export const dynamic = 'force-dynamic';

 * GET /api/go/[code]
 * Track affiliate click and redirect to coupon page
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params;
    const { searchParams } = new URL(request.url);
    const couponId = searchParams.get('coupon');

    // Find affiliate link
    const affiliateLink = await prisma.affiliateLink.findUnique({
      where: { trackingCode: code },
      include: {
        affiliate: true,
        coupon: true,
      },
    });

    if (!affiliateLink) {
      return errorResponse(new NotFoundError('Affiliate link not found'), 404);
    }

    // Get tracking data
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const referrer = request.headers.get('referer') || null;

    // Generate cookie ID for attribution
    const cookieId = generateCookieId();

    // Track the click
    await prisma.$transaction([
      // Create click record
      prisma.affiliateClick.create({
        data: {
          affiliateLinkId: affiliateLink.id,
          affiliateId: affiliateLink.affiliateId,
          ipAddress,
          userAgent,
          referrer,
          cookieId,
        },
      }),
      // Increment click count on link
      prisma.affiliateLink.update({
        where: { id: affiliateLink.id },
        data: {
          totalClicks: { increment: 1 },
        },
      }),
    ]);

    // Determine redirect URL
    let redirectUrl: string;
    
    if (couponId) {
      // Redirect to specific coupon
      const coupon = await prisma.coupon.findUnique({
        where: { id: couponId },
        select: { slug: true },
      });
      
      if (coupon) {
        redirectUrl = `/coupons/${coupon.slug}`;
      } else {
        redirectUrl = '/coupons';
      }
    } else if (affiliateLink.coupon) {
      // Redirect to link's associated coupon
      redirectUrl = `/coupons/${affiliateLink.coupon.slug}`;
    } else {
      // Redirect to general coupons page
      redirectUrl = '/coupons';
    }

    // Create response with redirect
    const response = NextResponse.redirect(
      new URL(redirectUrl, request.url).toString()
    );

    // Set attribution cookie (30 days)
    const cookieValue = createAffiliateCookieValue(affiliateLink.id, cookieId);
    const expiryDate = getAttributionCookieExpiry();

    response.cookies.set('affiliate_ref', cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiryDate,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Affiliate tracking error:', error);
    return NextResponse.redirect(new URL('/coupons', request.url).toString());
  }
}
