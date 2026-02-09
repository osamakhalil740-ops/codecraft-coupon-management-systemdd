import React, { useState, useEffect, useCallback } from 'react';
import { useRealTimeTracking } from '../hooks/useRealTimeTracking';
import StatCard from '../components/StatCard';
import { BanknotesIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import { api } from '../services/api';
import { Coupon, Redemption } from '../types';
import CouponCard from '../components/CouponCard';
import QRCodeModal from '../components/QRCodeModal';
import { logger } from '../utils/logger';

const AffiliateDashboard: React.FC = () => {
    const { user } = useAuth();
    const { t } = useTranslation();
    
    // Real-time tracking integration for affiliates
    const { trackingData, trackUserAction } = useRealTimeTracking(
        user?.roles || [], 
        user?.id
    );
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [redemptions, setRedemptions] = useState<Redemption[]>([]);
    const [customerData, setCustomerData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalInfo, setModalInfo] = useState<{url: string} | null>(null);
    const [activeTab, setActiveTab] = useState<'coupons' | 'redemptions'>('coupons');

    // Real-time data integration for affiliate insights
    useEffect(() => {
        if (trackingData && trackingData.customerData && trackingData.customerData.length > 0) {
            // Filter customer data for this affiliate
            const affiliateCustomerData = trackingData.customerData.filter(
                customer => customer.affiliateId === user?.id
            );
            setCustomerData(affiliateCustomerData);
            logger.debug(`🔴 LIVE: Affiliate received ${affiliateCustomerData.length} customer interactions`);
        }
    }, [trackingData?.customerData, user?.id]);

    useEffect(() => {
        if (trackingData && trackingData.redemptions && trackingData.redemptions.length > 0) {
            // Filter redemptions for this affiliate
            const affiliateRedemptions = trackingData.redemptions.filter(
                redemption => redemption.affiliateId === user?.id
            );
            setRedemptions(affiliateRedemptions);
            logger.debug(`🔴 LIVE: Affiliate received ${affiliateRedemptions.length} redemptions`);
        }
    }, [trackingData.redemptions, user?.id]);

    const fetchData = useCallback(async () => {
        if (user) {
            logger.debug('🔄 Fetching initial affiliate data for user:', user.id);
            setLoading(true);
            
            const [allCoupons, affiliateRedemptions, affiliateCustomers] = await Promise.all([
                api.getAllCoupons(),
                api.getRedemptionsForAffiliate(user.id),
                api.getCustomerDataForAffiliate(user.id),
            ]);
            
            logger.debug('📊 Initial affiliate data fetched:', {
                coupons: allCoupons.length,
                redemptions: affiliateRedemptions.length,
                customers: affiliateCustomers.length
            });
            
            setCoupons(allCoupons);
            // Only set if real-time data hasn't arrived yet
            if (trackingData.redemptions.length === 0) {
                setRedemptions(affiliateRedemptions);
            }
            if (trackingData.customerData.length === 0) {
                setCustomerData(affiliateCustomers);
            }
            setLoading(false);
        }
    }, [user, trackingData.redemptions.length, trackingData.customerData.length]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    if (!user) return null;
    
    // Calculate affiliate performance stats
    const totalPointsEarned = redemptions.reduce((sum, redemption) => sum + (redemption.commissionEarned || 0), 0);
    const totalExecutions = redemptions.length;
    const totalCustomers = customerData.length;
    const uniqueShops = new Set(redemptions.map(r => r.shopOwnerId)).size;

    const handleGetLink = (couponId: string) => {
        const url = `${window.location.origin}/#/coupon/${couponId}?affiliateId=${user.id}`;
        setModalInfo({ url });
    };

    return (
        <div className="space-y-8 animate-fadeIn">
            {modalInfo && <QRCodeModal url={modalInfo.url} onClose={() => setModalInfo(null)} />}
            
            <h1 className="text-3xl font-bold text-dark-gray">{t('affiliate.dashboardTitle')}</h1>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard title={t('affiliate.stats.totalPoints')} value={totalPointsEarned.toLocaleString()} icon={<BanknotesIcon className="h-6 w-6"/>} color="green" />
                <StatCard title={t('affiliate.stats.totalExecutions')} value={totalExecutions} icon={<CheckCircleIcon className="h-6 w-6"/>} color="blue" />
                <StatCard title="Total Customers" value={totalCustomers} icon={<CheckCircleIcon className="h-6 w-6"/>} color="purple" />
                <StatCard title="Partner Shops" value={uniqueShops} icon={<CheckCircleIcon className="h-6 w-6"/>} color="orange" />
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-4 mb-6">
                <button
                    onClick={() => setActiveTab('coupons')}
                    className={`px-6 py-3 rounded-lg font-semibold transition ${
                        activeTab === 'coupons' 
                            ? 'bg-primary text-white shadow-lg' 
                            : 'bg-white text-gray-600 hover:bg-slate-100 border'
                    }`}
                >
                    📦 Available Coupons
                </button>
                <button
                    onClick={() => setActiveTab('redemptions')}
                    className={`px-6 py-3 rounded-lg font-semibold transition ${
                        activeTab === 'redemptions' 
                            ? 'bg-primary text-white shadow-lg' 
                            : 'bg-white text-gray-600 hover:bg-slate-100 border'
                    }`}
                >
                    👥 Customer Redemption Data
                </button>
            </div>

            {/* Coupons Tab */}
            {activeTab === 'coupons' && (
                <div>
                    <h2 className="text-2xl font-semibold text-dark-gray mb-4">{t('affiliate.availableCoupons')}</h2>
                    {loading ? (
                        <p>{t('common.loading')}</p>
                    ) : (
                        coupons.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {coupons.map(coupon => (
                                    <CouponCard key={coupon.id} coupon={coupon} showAffiliateCommission={true}>
                                        <button
                                            onClick={() => handleGetLink(coupon.id)}
                                            className="w-full bg-success text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 transition-all shadow-md hover:shadow-lg transform hover:scale-105"
                                        >
                                            {t('affiliate.getLink')}
                                        </button>
                                    </CouponCard>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center p-4 bg-white rounded-xl shadow-lg border text-gray-500">{t('user.noCoupons.title')}</p>
                        )
                    )}
                </div>
            )}

            {/* Customer Redemption Data Tab */}
            {activeTab === 'redemptions' && (
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-lg border overflow-hidden">
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 border-b">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-800 mb-2">👥 Customer Redemption Data</h2>
                                    <p className="text-gray-600">Complete customer information for all coupons you've promoted</p>
                                    <p className="text-sm text-green-700 mt-1">
                                        📊 Showing data from {customerData.length > 0 ? new Set(customerData.map(item => item.source || 'standard')).size : 0} data sources
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={fetchData}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-medium flex items-center gap-2"
                                        disabled={loading}
                                    >
                                        🔄 {loading ? 'Refreshing...' : 'Refresh Data'}
                                    </button>
                                    {/* Debug button removed for production */}
                                </div>
                            </div>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-xs text-gray-700 uppercase">
                                    <tr>
                                        <th className="px-6 py-3 text-left">Date & Time</th>
                                        <th className="px-6 py-3 text-left">Coupon Details</th>
                                        <th className="px-6 py-3 text-left">Customer Information</th>
                                        <th className="px-6 py-3 text-left">Shop Owner</th>
                                        <th className="px-6 py-3 text-left">Your Commission</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {customerData.map((customer, index) => (
                                        <tr key={customer.id || `customer-${index}`} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900">
                                                    {customer.redeemedAt ? new Date(customer.redeemedAt).toLocaleDateString() : 'N/A'}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {customer.redeemedAt ? new Date(customer.redeemedAt).toLocaleTimeString() : 'N/A'}
                                                </div>
                                                <div className="text-xs text-blue-500">
                                                    Source: {customer.source || 'standard'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900">{customer.couponTitle || 'N/A'}</div>
                                                <div className="text-xs text-gray-500">ID: {customer.couponId?.slice(0, 8)}</div>
                                                <div className="text-xs text-blue-600">
                                                    {customer.discountType === 'percentage' ? `${customer.discountValue}% OFF` : `$${customer.discountValue} OFF`}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    {customer.customerName ? (
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {customer.customerName}
                                                        </div>
                                                    ) : (
                                                        <div className="text-sm font-medium text-red-600">
                                                            ⚠️ Customer name not provided
                                                        </div>
                                                    )}
                                                    
                                                    {customer.customerPhone ? (
                                                        <div className="text-xs text-gray-700">
                                                            📞 {customer.customerPhone}
                                                        </div>
                                                    ) : (
                                                        <div className="text-xs text-red-600">
                                                            📞 Phone number required but not provided
                                                        </div>
                                                    )}
                                                    
                                                    {customer.customerEmail ? (
                                                        <div className="text-xs text-gray-700">
                                                            ✉️ {customer.customerEmail}
                                                        </div>
                                                    ) : (
                                                        <div className="text-xs text-orange-600">
                                                            ✉️ Email not provided
                                                        </div>
                                                    )}
                                                    
                                                    {customer.customerAddress && (
                                                        <div className="text-xs text-gray-600">
                                                            📍 {customer.customerAddress}
                                                        </div>
                                                    )}
                                                    
                                                    {customer.customerAge && (
                                                        <div className="text-xs text-gray-600">
                                                            👤 Age: {customer.customerAge}{customer.customerGender ? `, ${customer.customerGender}` : ''}
                                                        </div>
                                                    )}
                                                    
                                                    <div className="text-xs text-blue-600">
                                                        Customer ID: {customer.userId?.slice(0, 8) || customer.customerId?.slice(0, 8) || 'Unknown'}
                                                    </div>
                                                    
                                                    {customer.isVerifiedCustomer && (
                                                        <div className="text-xs text-green-600">
                                                            ✅ Verified Customer
                                                        </div>
                                                    )}
                                                    
                                                    {customer.hasCompleteProfile && (
                                                        <div className="text-xs text-purple-600">
                                                            📋 Complete Profile
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {customer.shopOwnerName ? (
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {customer.shopOwnerName}
                                                    </div>
                                                ) : (
                                                    <div className="text-sm font-medium text-red-600">
                                                        ⚠️ Shop name not available
                                                    </div>
                                                )}
                                                <div className="text-xs text-gray-500">
                                                    Shop ID: {customer.shopOwnerId?.slice(0, 8) || 'Unknown'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-green-600">
                                                    💰 {customer.commissionEarned || 0} credits
                                                </div>
                                                <div className="text-xs text-blue-600">
                                                    🎁 Customer earned: {customer.customerRewardPoints || 0} points
                                                </div>
                                                {customer.affiliatePromotionSuccess && (
                                                    <div className="text-xs text-green-600">
                                                        ✅ Promotion Success
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {customerData.length === 0 && !loading && (
                                <div className="text-center py-8 text-gray-500">
                                    <div className="mb-4">
                                        No customer redemptions yet. Start promoting coupons to see customer data here.
                                    </div>
                                    <button 
                                        onClick={fetchData}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"
                                    >
                                        🔄 Refresh Data
                                    </button>
                                </div>
                            )}
                            
                            {loading && (
                                <div className="text-center py-8 text-blue-600">
                                    <div className="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent rounded-full" role="status">
                                        <span className="sr-only">Loading...</span>
                                    </div>
                                    <div className="mt-2">Loading customer data...</div>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {customerData.length > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-blue-700">{customerData.length}</div>
                                    <div className="text-sm text-blue-600">Total Customers</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-green-700">{customerData.filter(c => c.isVerifiedCustomer).length}</div>
                                    <div className="text-sm text-green-600">Verified Customers</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-purple-700">{customerData.filter(c => c.hasCompleteProfile).length}</div>
                                    <div className="text-sm text-purple-600">Complete Profiles</div>
                                </div>
                            </div>
                            <p className="text-blue-800 text-sm">
                                <strong>📊 Affiliate Analytics:</strong> As an affiliate, you have complete access to customer information for coupons you've promoted. This includes contact details, demographics, and redemption patterns to help you optimize your marketing strategies.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AffiliateDashboard;