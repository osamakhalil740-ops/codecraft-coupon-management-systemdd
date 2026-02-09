import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createPaymentCheckoutSession } from '@/lib/stripe';
import { FEATURED_PRICING } from '@/lib/stripe-config';
import { apiResponse } from '@/lib/api-response';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';


// Force dynamic rendering
export const dynamic = 'force-dynamic';

const featuredCheckoutSchema = z.object({
  type: z.enum(['featured_coupon', 'featured_store']),
  resourceId: z.string(),
  duration: z.enum(['7', '14', '30']),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return apiResponse.unauthorized('You must be logged in');
    }

    const body = await req.json();
    const validation = featuredCheckoutSchema.safeParse(body);

    if (!validation.success) {
      return apiResponse.badRequest('Invalid request data', validation.error.errors);
    }

    const { type, resourceId, duration } = validation.data;

    // Verify ownership
    if (type === 'featured_coupon') {
      const coupon = await prisma.coupon.findFirst({
        where: {
          id: resourceId,
          createdById: session.user.id,
        },
      });

      if (!coupon) {
        return apiResponse.forbidden('Coupon not found or access denied');
      }
    } else {
      const store = await prisma.store.findFirst({
        where: {
          id: resourceId,
          ownerId: session.user.id,
        },
      });

      if (!store) {
        return apiResponse.forbidden('Store not found or access denied');
      }
    }

    // Get pricing
    const pricingKey = `${type === 'featured_coupon' ? 'COUPON' : 'STORE'}_${duration}_DAYS` as keyof typeof FEATURED_PRICING;
    const pricing = FEATURED_PRICING[pricingKey];

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    const checkoutSession = await createPaymentCheckoutSession({
      userId: session.user.id,
      email: session.user.email!,
      amount: Math.round(pricing.price * 100), // Convert to cents
      description: pricing.name,
      type,
      resourceId,
      successUrl: `${appUrl}/store-owner?payment_id={CHECKOUT_SESSION_ID}&featured=success`,
      cancelUrl: `${appUrl}/store-owner?featured=canceled`,
    });

    return apiResponse.success({ url: checkoutSession.url });
  } catch (error) {
    console.error('Featured checkout error:', error);
    return apiResponse.error('Failed to create checkout session', 500);
  }
}
