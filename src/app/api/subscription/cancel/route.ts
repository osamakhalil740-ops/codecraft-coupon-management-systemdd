import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { cancelSubscription } from '@/lib/stripe';
import { getUserSubscription } from '@/lib/subscription-helpers';
import { apiResponse } from '@/lib/api-response';


// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return apiResponse.unauthorized('You must be logged in');
    }

    const subscription = await getUserSubscription(session.user.id);

    if (!subscription) {
      return apiResponse.badRequest('No active subscription found');
    }

    // Cancel at period end (don't immediately cancel)
    await cancelSubscription(subscription.stripeSubscriptionId, true);

    return apiResponse.success({
      message: 'Subscription will be canceled at the end of the billing period',
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    return apiResponse.error('Failed to cancel subscription', 500);
  }
}
