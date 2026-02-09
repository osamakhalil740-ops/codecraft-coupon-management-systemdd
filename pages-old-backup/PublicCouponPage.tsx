
import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Coupon } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../hooks/useAuth';
import CouponCard from '../components/CouponCard';
import { QRCodeSVG } from 'qrcode.react';
import { QrCodeIcon } from '@heroicons/react/24/outline';

const PublicCouponPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const { t } = useTranslation();
    const { user } = useAuth();
    const [coupon, setCoupon] = useState<Coupon | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isActivating, setIsActivating] = useState(false);
    const [activationMessage, setActivationMessage] = useState('');

    const queryParams = new URLSearchParams(location.search);
    const affiliateId = queryParams.get('affiliateId');
    
    useEffect(() => {
        const fetchAndTrackCoupon = async () => {
            if (!id) {
                setError(t('validationPortal.notFound'));
                setLoading(false);
                return;
            };
            
            setLoading(true);
            try {
                // Track click first, it will fail silently if coupon doesn't exist
                await api.trackCouponClick(id);

                const data = await api.getCouponById(id);
                if (data) {
                    setCoupon(data);
                } else {
                    setError(t('validationPortal.notFound'));
                }
            } catch (err) {
                setError(t('validationPortal.loadError'));
            } finally {
                setLoading(false);
            }
        };
        fetchAndTrackCoupon();
    }, [id, t]);

    // Removed handleActivateCoupon - All redemptions now go through validation portal with customer data

    if (loading) return <div className="text-center p-10">{t('common.loading')}</div>;
    if (error) return <div className="text-center p-10 text-alert">{error}</div>;
    if (!coupon) return null;

    const validationUrl = `${window.location.origin}/#/validate/${coupon.id}${affiliateId ? `?affiliateId=${affiliateId}` : ''}`;

    return (
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-start animate-fadeIn">
            <div className="md:col-span-1">
                <h2 className="text-2xl font-bold text-center mb-4 text-dark-gray">{t('publicCoupon.forTheCustomer.title')}</h2>
                <p className="text-center text-gray-600 mb-6">{t('publicCoupon.forTheCustomer.description')}</p>
                <CouponCard coupon={coupon} showAffiliateCommission={!!affiliateId} />
                
                {/* Customer Redemption Section - REQUIRES VALIDATION */}
                <div className="mt-6 bg-white p-6 rounded-xl shadow-lg border">
                    <div className="text-center mb-4">
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">🎯 Redeem This Coupon</h3>
                        <p className="text-gray-600 text-sm">
                            All coupon redemptions require verification through the merchant for your security and to collect customer details.
                        </p>
                    </div>
                    
                    {!user && (
                        <div className="text-center">
                            <p className="text-gray-600 mb-4">Login to redeem this coupon and earn reward points!</p>
                            <Link to="/login" className="w-full bg-primary text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 transition-all shadow-md hover:shadow-lg transform hover:scale-105 inline-block text-center">
                                Login to Redeem
                            </Link>
                        </div>
                    )}
                    
                    {user && coupon.customerRewardPoints > 0 && (
                        <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200 mb-4">
                            <p className="text-blue-800 font-semibold">🎁 You'll earn {coupon.customerRewardPoints} points for redeeming this coupon!</p>
                        </div>
                    )}
                    
                    {user && coupon.usesLeft > 0 && (
                        <Link 
                            to={`/validate/${coupon.id}${affiliateId ? `?affiliateId=${affiliateId}` : ''}`}
                            className="w-full bg-success text-white font-bold py-4 px-6 rounded-lg hover:opacity-90 transition-all shadow-md hover:shadow-lg transform hover:scale-105 text-lg inline-block text-center"
                        >
                            🎫 Redeem Coupon with Details ({coupon.usesLeft} left)
                        </Link>
                    )}
                    
                    {user && coupon.usesLeft <= 0 && (
                        <div className="text-center p-4 bg-gray-100 rounded-lg">
                            <p className="text-gray-600 font-semibold">This coupon has no uses left</p>
                        </div>
                    )}
                    
                    <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <p className="text-orange-800 text-xs">
                            🔒 <strong>Security Notice:</strong> All redemptions require customer verification through the merchant. This ensures security and helps businesses serve you better.
                        </p>
                    </div>
                </div>
            </div>
             <div className="md:col-span-1 bg-white p-6 rounded-xl shadow-lg border animate-slideInUp">
                <div className="text-center border-b border-dashed pb-4 mb-4">
                    <QrCodeIcon className="h-8 w-8 mx-auto text-gray-400 mb-2"/>
                    <h2 className="text-xl font-bold">{t('publicCoupon.forTheMerchant.title')}</h2>
                    <p className="text-gray-600 text-sm">{t('publicCoupon.forTheMerchant.description')}</p>
                </div>
                <div className="flex justify-center mb-4 p-2 bg-white rounded-lg border">
                     <QRCodeSVG value={validationUrl} size={192} />
                </div>
                <Link 
                    to={`/validate/${coupon.id}${affiliateId ? `?affiliateId=${affiliateId}` : ''}`}
                    className="w-full block text-center bg-success text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 transition-all shadow-md hover:shadow-lg transform hover:scale-105"
                >
                    {t('publicCoupon.forTheMerchant.button')}
                </Link>
            </div>
        </div>
    );
};

export default PublicCouponPage;