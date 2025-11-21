
import React from 'react';
import { Coupon } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { CalendarDaysIcon, CheckBadgeIcon, EyeIcon, SparklesIcon } from '@heroicons/react/24/outline';

interface CouponCardProps {
    coupon: Coupon;
    children?: React.ReactNode;
    showAffiliateCommission?: boolean;
}

const CouponCard: React.FC<CouponCardProps> = ({ coupon, children, showAffiliateCommission = false }) => {
    const { t } = useTranslation();

    const getDiscountText = () => {
        if (coupon.discountType === 'percentage') {
            return `${coupon.discountValue}% ${t('couponCard.off')}`;
        }
        return `${coupon.discountValue} ${t('couponCard.egpOff')}`;
    };

    const getValidityText = () => {
        if (coupon.validityType === 'expiryDate' && coupon.expiryDate) {
            const date = new Date(coupon.expiryDate);
            return `${t('couponCard.validUntil')} ${date.toLocaleDateString()}`;
        }
        if (coupon.validityType === 'days' && coupon.validityDays) {
            const expiry = new Date(new Date(coupon.createdAt).getTime() + coupon.validityDays * 24 * 60 * 60 * 1000);
            return `${t('couponCard.expiresOn')} ${expiry.toLocaleDateString()}`;
        }
        return t('couponCard.noExpiry');
    };

    const isExpired = () => {
        if (coupon.usesLeft <= 0) return true;
        if (coupon.validityType === 'expiryDate' && coupon.expiryDate) {
            return new Date(coupon.expiryDate) < new Date();
        }
        if (coupon.validityType === 'days' && coupon.validityDays) {
            const expiry = new Date(new Date(coupon.createdAt).getTime() + coupon.validityDays * 24 * 60 * 60 * 1000);
            return expiry < new Date();
        }
        return false;
    };
    
    const expired = isExpired();
    const status = expired ? t('couponCard.status.inactive') : t('couponCard.status.active');
    const statusColor = expired ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800';

    return (
        <div className={`enhanced-card card-lift p-5 flex flex-col justify-between ${expired ? 'opacity-60' : ''} bounce-in`}>
            <div>
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-gray-800 pr-2">{coupon.title}</h3>
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${statusColor} whitespace-nowrap`}>{status}</span>
                </div>
                <p className="text-sm text-gray-500 mb-4">by {coupon.shopOwnerName}</p>
                <p className="text-sm text-gray-600 mb-4 min-h-[40px]">{coupon.description}</p>
                
                <div className="bg-gradient-to-r from-primary/10 to-blue-500/10 p-4 rounded-lg text-center mb-4">
                     <p className="text-3xl font-extrabold text-primary">{getDiscountText()}</p>
                </div>

                <div className="space-y-3 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                        <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
                        <span>{getValidityText()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <CheckBadgeIcon className="h-5 w-5 text-gray-400" />
                        <span>{coupon.usesLeft} / {coupon.maxUses} {t('couponCard.usesLeft')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <EyeIcon className="h-5 w-5 text-gray-400" />
                        <span>{coupon.clicks} {t('couponCard.views')}</span>
                    </div>
                    {showAffiliateCommission && coupon.affiliateCommission > 0 && (
                        <div className="flex items-center gap-2 pt-2 text-success font-semibold border-t border-dashed mt-3">
                            <SparklesIcon className="h-5 w-5" />
                            <span>{t('couponCard.earn')} {coupon.affiliateCommission} {t('common.credits')} {t('couponCard.onRedeem')}</span>
                        </div>
                    )}
                    {coupon.customerRewardPoints > 0 && (
                        <div className="flex items-center gap-2 pt-2 text-primary font-semibold border-t border-dashed mt-3">
                            <SparklesIcon className="h-5 w-5" />
                            <span>Customer earns {coupon.customerRewardPoints} {t('common.credits')} on redemption</span>
                        </div>
                    )}
                </div>
            </div>
            {children && !expired && <div className="mt-6 pt-4 border-t border-gray-200">{children}</div>}
        </div>
    );
};

export default CouponCard;