export type Role = 'admin' | 'shop-owner' | 'affiliate' | 'user';

export interface Shop {
  id: string;
  name: string;
  email: string;
  roles: Role[];
  credits: number;
  referralCode: string;
  referredBy?: string;
  hasRedeemedFirstCoupon: boolean;
  // New fields for marketplace
  country: string;
  city: string;
  category: string;
  // Detailed address fields
  shopDescription: string;
  addressLine1: string;
  addressLine2: string;
  state: string;
  postalCode: string;
}

export interface Coupon {
  id: string;
  shopOwnerId: string;
  shopOwnerName: string;
  title: string;
  description: string;
  maxUses: number;
  usesLeft: number;
  createdAt: string; // ISO string
  clicks: number; // New field for tracking views

  // New detailed fields
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  validityType: 'expiryDate' | 'days';
  expiryDate?: string; // ISO string
  validityDays?: number;
  affiliateCommission: number; // in credits
  customerRewardPoints: number; // Points awarded to customer who redeems
}

export interface CreateCouponData {
  shopOwnerId: string;
  title: string;
  description: string;
  maxUses: number;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  validityType: 'expiryDate' | 'days';
  expiryDate?: string;
  validityDays?: number;
  affiliateCommission: number;
  customerRewardPoints: number;
  creationCost?: number; // Cost to create this coupon
}

// Credit Request System
export interface CreditRequest {
  id: string;
  shopOwnerId: string;
  shopOwnerName: string;
  shopOwnerEmail: string;
  requestedAmount: number;
  status: 'pending' | 'key_generated' | 'completed';
  message: string; // Shop owner's request message
  adminResponse?: string; // Admin's response
  requestedAt: string; // ISO string
  processedAt?: string; // ISO string
  processedBy?: string; // Admin email
}

// Credit Activation Key System
export interface CreditKey {
  id: string;
  keyCode: string; // Unique activation key
  requestId: string; // Links to the original credit request
  shopOwnerId: string;
  creditAmount: number;
  isUsed: boolean;
  createdBy: string; // Admin email who created it
  createdAt: string; // ISO string
  usedAt?: string; // ISO string
  expiresAt: string; // ISO string
  description: string; // Purpose of the key
}

export interface Redemption {
    id: string;
    couponId: string;
    couponTitle: string;
    shopOwnerId: string;
    redeemedAt: string; // ISO string
    affiliateId?: string;
    commissionEarned?: number;
    customerId?: string; // User who redeemed the coupon
    customerRewardEarned?: number; // Points earned by customer
}

export interface Referral {
    id: string;
    referrerId: string;
    referredId: string;
    referredShopName: string;
    status: 'pending' | 'rewarded';
    signupDate: string; // ISO string
}

export interface AdminCreditLog {
    id: string;
    type: 'Standard Signup' | 'Referred Signup' | 'Referrer Bonus' | 'Affiliate Commission' | 'Customer Reward' | 'Coupon Creation Cost' | 'Credit Purchase' | 'Admin Grant';
    shopId: string;
    shopName: string;
    amount: number;
    timestamp: string; // ISO string
    details?: string; // Additional information
}