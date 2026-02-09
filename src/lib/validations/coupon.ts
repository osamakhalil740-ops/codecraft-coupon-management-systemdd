import { z } from 'zod';
import { CouponType } from '@prisma/client';

const baseCouponSchema = z.object({
  code: z
    .string()
    .min(3, 'Coupon code must be at least 3 characters')
    .max(50, 'Coupon code must be at most 50 characters')
    .regex(/^[A-Z0-9-_]+$/, 'Coupon code must contain only uppercase letters, numbers, hyphens, and underscores'),
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().optional(),
  type: z.nativeEnum(CouponType),
  discountValue: z.number().positive('Discount value must be positive'),
  minPurchase: z.number().positive().optional(),
  maxDiscount: z.number().positive().optional(),
  usageLimit: z.number().int().positive().optional(),
  perUserLimit: z.number().int().positive().optional(),
  startDate: z.date(),
  expiryDate: z.date(),
  storeId: z.string().min(1, 'Store is required'),
  categoryId: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  thumbnailUrl: z.string().url().optional().or(z.literal('')),
});

export const createCouponSchema = baseCouponSchema.refine((data) => data.expiryDate > data.startDate, {
  message: 'Expiry date must be after start date',
  path: ['expiryDate'],
}).refine((data) => {
  if (data.type === CouponType.PERCENTAGE && data.discountValue > 100) {
    return false;
  }
  return true;
}, {
  message: 'Percentage discount cannot exceed 100%',
  path: ['discountValue'],
});

export const updateCouponSchema = baseCouponSchema.partial();

export type CreateCouponInput = z.infer<typeof createCouponSchema>;
export type UpdateCouponInput = z.infer<typeof updateCouponSchema>;
