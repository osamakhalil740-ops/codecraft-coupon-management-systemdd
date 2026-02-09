import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createSubscriptionCheckoutSession } from '@/lib/stripe';
import { getPlanConfig } from '@/lib/stripe-config';
import { SubscriptionPlan } from '@prisma/client';
import { apiResponse } from '@/lib/api-response';
import { z } from 'zod';


// Force dynamic rendering
export const dynamic = 'force-dynamic';

const subscriptionCheckoutSchema = z.object({
  plan: z.nativeEnum(SubscriptionPlan),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return apiResponse.unauthorized('You must be logged in');
    }

    const body = await req.json();
    const validation = subscriptionCheckoutSchema.safeParse(body);

    if (!validation.success) {
      return apiResponse.badRequest('Invalid request data', validation.error.errors);
    }

    const { plan } = validation.data;

    // Don't create checkout session for free plan
    if (plan === SubscriptionPlan.FREE) {
      return apiResponse.badRequest('Cannot create checkout session for free plan');
    }

    const planConfig = getPlanConfig(plan);

    if (!planConfig.priceId) {
      return apiResponse.error('Plan price ID not configured', 500);
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    const checkoutSession = await createSubscriptionCheckoutSession({
      userId: session.user.id,
      email: session.user.email!,
      priceId: planConfig.priceId,
      successUrl: `${appUrl}/store-owner?session_id={CHECKOUT_SESSION_ID}&subscription=success`,
      cancelUrl: `${appUrl}/store-owner?subscription=canceled`,
      trialDays: planConfig.trialDays,
    });

    return apiResponse.success({ url: checkoutSession.url });
  } catch (error) {
    console.error('Subscription checkout error:', error);
    return apiResponse.error('Failed to create checkout session', 500);
  }
}
