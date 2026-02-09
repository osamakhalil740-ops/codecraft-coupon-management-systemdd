import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createBillingPortalSession } from '@/lib/stripe';
import { apiResponse } from '@/lib/api-response';
import { prisma } from '@/lib/prisma';


// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return apiResponse.unauthorized('You must be logged in');
    }

    // Get user's Stripe customer ID
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { stripeCustomerId: true },
    });

    if (!user?.stripeCustomerId) {
      return apiResponse.badRequest('No billing information found');
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    const portalSession = await createBillingPortalSession(
      user.stripeCustomerId,
      `${appUrl}/store-owner`
    );

    return apiResponse.success({ url: portalSession.url });
  } catch (error) {
    console.error('Billing portal error:', error);
    return apiResponse.error('Failed to create billing portal session', 500);
  }
}
