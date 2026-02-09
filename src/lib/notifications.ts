import { prisma } from '@/lib/prisma';
import { sendNotification } from '@/lib/queue';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import CouponApprovedEmail from '../../emails/CouponApproved';
import AffiliateConversionEmail from '../../emails/AffiliateConversion';
import PayoutApprovedEmail from '../../emails/PayoutApproved';

// Lazy initialization to avoid build-time errors when env vars are not set
let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

export interface NotificationData {
  userId: string;
  type: string;
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
  couponId?: string;
  storeId?: string;
  affiliateId?: string;
  metadata?: Record<string, any>;
  sendEmail?: boolean;
  emailLocale?: string;
}

/**
 * Create notification (in-app + optionally email)
 */
export async function createNotification(data: NotificationData) {
  try {
    // Create in-app notification
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type as any,
        title: data.title,
        message: data.message,
        actionUrl: data.actionUrl,
        actionText: data.actionText,
        couponId: data.couponId,
        storeId: data.storeId,
        affiliateId: data.affiliateId,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      },
    });

    // Queue email notification if requested
    if (data.sendEmail !== false) {
      await sendNotification({
        ...data,
        sendEmail: true,
      });
    }

    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
    throw error;
  }
}

/**
 * Send email notification based on type
 */
export async function sendEmailNotification(data: NotificationData) {
  try {
    // Get user email
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      select: { email: true, name: true },
    });

    if (!user?.email) {
      console.error('User email not found:', data.userId);
      return;
    }

    const locale = data.emailLocale || 'en';
    let emailHtml: string;
    let emailSubject: string;

    // Render email based on notification type
    switch (data.type) {
      case 'COUPON_APPROVED':
        emailHtml = render(
          CouponApprovedEmail({
            couponTitle: data.metadata?.couponTitle || '',
            couponCode: data.metadata?.couponCode || '',
            storeOwnerName: user.name || 'there',
            couponUrl: data.actionUrl || '',
            locale,
          })
        );
        emailSubject = locale === 'ar' 
          ? 'تمت الموافقة على الكوبون الخاص بك!'
          : 'Your Coupon Has Been Approved!';
        break;

      case 'AFFILIATE_CONVERSION':
        emailHtml = render(
          AffiliateConversionEmail({
            affiliateName: user.name || 'there',
            couponTitle: data.metadata?.couponTitle || '',
            commissionAmount: data.metadata?.commissionAmount || 0,
            orderValue: data.metadata?.orderValue,
            commissionRate: data.metadata?.commissionRate || 0,
            dashboardUrl: data.actionUrl || '',
            locale,
          })
        );
        emailSubject = locale === 'ar'
          ? 'لقد ربحت عمولة!'
          : 'You Earned a Commission!';
        break;

      case 'PAYOUT_APPROVED':
        emailHtml = render(
          PayoutApprovedEmail({
            affiliateName: user.name || 'there',
            amount: data.metadata?.amount || 0,
            paymentMethod: data.metadata?.paymentMethod || '',
            transactionId: data.metadata?.transactionId || '',
            dashboardUrl: data.actionUrl || '',
            locale,
          })
        );
        emailSubject = locale === 'ar'
          ? 'تمت الموافقة على طلب السحب!'
          : 'Your Payout Has Been Approved!';
        break;

      default:
        // Generic notification email
        emailHtml = `
          <!DOCTYPE html>
          <html>
            <head><meta charset="utf-8"></head>
            <body style="font-family: sans-serif; padding: 20px;">
              <h2>${data.title}</h2>
              <p>${data.message}</p>
              ${data.actionUrl ? `<a href="${data.actionUrl}" style="display: inline-block; padding: 10px 20px; background-color: #556cd6; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px;">${data.actionText || 'View'}</a>` : ''}
            </body>
          </html>
        `;
        emailSubject = data.title;
    }

    // Send email via Resend
    const result = await getResendClient().emails.send({
      from: process.env.EMAIL_FROM || 'notifications@kobonz.com',
      to: user.email,
      subject: emailSubject,
      html: emailHtml,
    });

    // Update notification with email status
    await prisma.notification.updateMany({
      where: {
        userId: data.userId,
        type: data.type as any,
        emailSent: false,
      },
      data: {
        emailSent: true,
        emailSentAt: new Date(),
      },
    });

    console.log(`✅ Email sent to ${user.email}:`, result);
    return result;
  } catch (error) {
    console.error('Failed to send email notification:', error);
    throw error;
  }
}

/**
 * Helper: Notify coupon approval
 */
export async function notifyCouponApproved(
  userId: string,
  couponId: string,
  couponTitle: string,
  couponCode: string,
  couponSlug: string
) {
  return createNotification({
    userId,
    type: 'COUPON_APPROVED',
    title: 'Coupon Approved',
    message: `Your coupon "${couponTitle}" has been approved and is now live!`,
    actionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/coupons/${couponSlug}`,
    actionText: 'View Coupon',
    couponId,
    metadata: { couponTitle, couponCode },
    sendEmail: true,
  });
}

/**
 * Helper: Notify coupon rejection
 */
export async function notifyCouponRejected(
  userId: string,
  couponId: string,
  couponTitle: string,
  reason: string
) {
  return createNotification({
    userId,
    type: 'COUPON_REJECTED',
    title: 'Coupon Rejected',
    message: `Your coupon "${couponTitle}" was rejected. Reason: ${reason}`,
    actionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/store-owner/coupons`,
    actionText: 'View Coupons',
    couponId,
    metadata: { couponTitle, reason },
    sendEmail: true,
  });
}

/**
 * Helper: Notify affiliate conversion
 */
export async function notifyAffiliateConversion(
  affiliateUserId: string,
  affiliateId: string,
  couponId: string,
  couponTitle: string,
  commissionAmount: number,
  commissionRate: number,
  orderValue?: number
) {
  return createNotification({
    userId: affiliateUserId,
    type: 'AFFILIATE_CONVERSION',
    title: 'New Commission Earned',
    message: `You earned $${commissionAmount.toFixed(2)} from "${couponTitle}"!`,
    actionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/affiliate`,
    actionText: 'View Dashboard',
    couponId,
    affiliateId,
    metadata: {
      couponTitle,
      commissionAmount,
      commissionRate,
      orderValue,
    },
    sendEmail: true,
  });
}

/**
 * Helper: Notify payout approved
 */
export async function notifyPayoutApproved(
  userId: string,
  affiliateId: string,
  amount: number,
  paymentMethod: string,
  transactionId: string
) {
  return createNotification({
    userId,
    type: 'PAYOUT_APPROVED',
    title: 'Payout Approved',
    message: `Your payout of $${amount.toFixed(2)} has been approved and processed!`,
    actionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/affiliate`,
    actionText: 'View Dashboard',
    affiliateId,
    metadata: {
      amount,
      paymentMethod,
      transactionId,
    },
    sendEmail: true,
  });
}

/**
 * Helper: Notify payout rejected
 */
export async function notifyPayoutRejected(
  userId: string,
  affiliateId: string,
  amount: number,
  reason: string
) {
  return createNotification({
    userId,
    type: 'PAYOUT_REJECTED',
    title: 'Payout Rejected',
    message: `Your payout request of $${amount.toFixed(2)} was rejected. Reason: ${reason}`,
    actionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/affiliate`,
    actionText: 'View Dashboard',
    affiliateId,
    metadata: {
      amount,
      reason,
    },
    sendEmail: true,
  });
}

/**
 * Helper: Notify store approved
 */
export async function notifyStoreApproved(
  userId: string,
  storeId: string,
  storeName: string,
  storeSlug: string
) {
  return createNotification({
    userId,
    type: 'STORE_APPROVED',
    title: 'Store Approved',
    message: `Your store "${storeName}" has been approved!`,
    actionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/stores/${storeSlug}`,
    actionText: 'View Store',
    storeId,
    metadata: { storeName },
    sendEmail: true,
  });
}

/**
 * Helper: Notify new review
 */
export async function notifyNewReview(
  userId: string,
  storeId: string,
  storeName: string,
  rating: number,
  reviewerName: string
) {
  return createNotification({
    userId,
    type: 'NEW_REVIEW',
    title: 'New Review',
    message: `${reviewerName} left a ${rating}-star review on "${storeName}"`,
    actionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/store-owner`,
    actionText: 'View Reviews',
    storeId,
    metadata: { storeName, rating, reviewerName },
    sendEmail: true,
  });
}
