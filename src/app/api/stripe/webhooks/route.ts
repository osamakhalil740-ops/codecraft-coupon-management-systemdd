import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { constructWebhookEvent } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { SubscriptionStatus, SubscriptionPlan } from '@prisma/client';
import { getPlanConfig } from '@/lib/stripe-config';
import Stripe from 'stripe';


// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = headers().get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  try {
    const event = constructWebhookEvent(body, signature);

    console.log(`Webhook received: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 400 }
    );
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;

  if (!userId) {
    console.error('No userId in session metadata');
    return;
  }

  if (session.mode === 'subscription' && session.subscription) {
    // Subscription checkout completed - subscription will be created/updated via subscription events
    console.log(`Subscription checkout completed for user ${userId}`);
  } else if (session.mode === 'payment') {
    // One-time payment for featured coupon/store
    const { type, resourceId } = session.metadata || {};
    
    if (type && resourceId && session.payment_intent) {
      await handleFeaturedPayment(
        userId,
        type,
        resourceId,
        session.payment_intent as string,
        session.customer as string,
        session.amount_total || 0
      );
    }
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  const customerId = subscription.customer as string;

  if (!userId) {
    // Try to find user by customer ID
    const user = await prisma.user.findFirst({
      where: { stripeCustomerId: customerId },
    });

    if (!user) {
      console.error('No user found for subscription');
      return;
    }

    subscription.metadata = { ...subscription.metadata, userId: user.id };
  }

  const finalUserId = userId || subscription.metadata?.userId;
  if (!finalUserId) return;

  // Map Stripe status to our status
  const status = mapStripeStatus(subscription.status);
  
  // Determine plan from price ID
  const priceId = subscription.items.data[0]?.price.id;
  const plan = getPlanFromPriceId(priceId);

  const planConfig = getPlanConfig(plan);

  // Upsert subscription
  await prisma.subscription.upsert({
    where: {
      stripeSubscriptionId: subscription.id,
    },
    create: {
      userId: finalUserId,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: customerId,
      stripePriceId: priceId || '',
      stripeProductId: subscription.items.data[0]?.price.product as string,
      plan,
      status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
      trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      maxStores: planConfig.limits.maxStores,
      maxCoupons: planConfig.limits.maxCoupons,
      maxFeaturedCoupons: planConfig.limits.maxFeaturedCoupons,
      maxFeaturedStores: planConfig.limits.maxFeaturedStores,
    },
    update: {
      status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
      plan,
      stripePriceId: priceId || '',
      maxStores: planConfig.limits.maxStores,
      maxCoupons: planConfig.limits.maxCoupons,
      maxFeaturedCoupons: planConfig.limits.maxFeaturedCoupons,
      maxFeaturedStores: planConfig.limits.maxFeaturedStores,
    },
  });

  console.log(`Subscription ${subscription.id} updated for user ${finalUserId}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await prisma.subscription.updateMany({
    where: {
      stripeSubscriptionId: subscription.id,
    },
    data: {
      status: SubscriptionStatus.CANCELED,
      canceledAt: new Date(),
    },
  });

  console.log(`Subscription ${subscription.id} deleted`);
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  const subscriptionId = invoice.subscription as string | null;

  // Find subscription
  const subscription = subscriptionId
    ? await prisma.subscription.findUnique({
        where: { stripeSubscriptionId: subscriptionId },
      })
    : null;

  // Create invoice record
  await prisma.invoice.create({
    data: {
      subscriptionId: subscription?.id,
      userId: subscription?.userId || '',
      stripeInvoiceId: invoice.id,
      stripeCustomerId: customerId,
      amount: (invoice.amount_paid || 0) / 100,
      currency: invoice.currency,
      status: invoice.status || 'paid',
      hostedInvoiceUrl: invoice.hosted_invoice_url,
      invoicePdf: invoice.invoice_pdf,
      periodStart: invoice.period_start ? new Date(invoice.period_start * 1000) : null,
      periodEnd: invoice.period_end ? new Date(invoice.period_end * 1000) : null,
      paidAt: new Date(),
      dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : null,
    },
  });

  console.log(`Invoice ${invoice.id} paid`);
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string | null;

  if (subscriptionId) {
    // Update subscription status to PAST_DUE
    await prisma.subscription.updateMany({
      where: {
        stripeSubscriptionId: subscriptionId,
      },
      data: {
        status: SubscriptionStatus.PAST_DUE,
      },
    });

    console.log(`Invoice payment failed for subscription ${subscriptionId}`);
  }
}

async function handleFeaturedPayment(
  userId: string,
  type: string,
  resourceId: string,
  paymentIntentId: string,
  customerId: string,
  amount: number
) {
  // Record payment
  await prisma.payment.create({
    data: {
      userId,
      stripePaymentIntentId: paymentIntentId,
      stripeCustomerId: customerId,
      amount: amount / 100,
      status: 'succeeded',
      type,
      resourceId,
      description: `Featured ${type === 'featured_coupon' ? 'coupon' : 'store'} payment`,
    },
  });

  // Update resource to featured
  const daysMap: Record<string, number> = {
    '7': 7,
    '14': 14,
    '30': 30,
  };

  // Get days from amount (this is a simple mapping, you might want to store this in metadata)
  let days = 7; // default
  if (amount >= 2499) days = 30;
  else if (amount >= 1499) days = 14;
  else if (amount >= 999) days = 14;
  else if (amount >= 799) days = 14;

  const featuredUntil = new Date();
  featuredUntil.setDate(featuredUntil.getDate() + days);

  if (type === 'featured_coupon') {
    await prisma.coupon.update({
      where: { id: resourceId },
      data: {
        isFeatured: true,
        featuredUntil,
      },
    });
  } else if (type === 'featured_store') {
    await prisma.store.update({
      where: { id: resourceId },
      data: {
        isFeatured: true,
        featuredUntil,
      },
    });
  }

  console.log(`Featured payment processed for ${type} ${resourceId}`);
}

function mapStripeStatus(stripeStatus: Stripe.Subscription.Status): SubscriptionStatus {
  switch (stripeStatus) {
    case 'active':
      return SubscriptionStatus.ACTIVE;
    case 'past_due':
      return SubscriptionStatus.PAST_DUE;
    case 'canceled':
      return SubscriptionStatus.CANCELED;
    case 'incomplete':
    case 'incomplete_expired':
      return SubscriptionStatus.INCOMPLETE;
    case 'trialing':
      return SubscriptionStatus.TRIALING;
    default:
      return SubscriptionStatus.CANCELED;
  }
}

function getPlanFromPriceId(priceId?: string): SubscriptionPlan {
  if (!priceId) return SubscriptionPlan.FREE;

  // Match price ID to plan
  if (priceId === process.env.STRIPE_BASIC_PRICE_ID) {
    return SubscriptionPlan.BASIC;
  } else if (priceId === process.env.STRIPE_PRO_PRICE_ID) {
    return SubscriptionPlan.PRO;
  } else if (priceId === process.env.STRIPE_ENTERPRISE_PRICE_ID) {
    return SubscriptionPlan.ENTERPRISE;
  }

  return SubscriptionPlan.FREE;
}
