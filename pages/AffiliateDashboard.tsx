
import React, { useState, useEffect, useCallback } from 'react';
import StatCard from '../components/StatCard';
import { BanknotesIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import { api } from '../services/api';
import { Coupon, Redemption } from '../types';
import CouponCard from '../components/CouponCard';
import QRCodeModal from '../components/QRCodeModal';

const AffiliateDashboard: React.FC = () => {
    const { user } = useAuth();
    const { t } = useTranslation();
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [redemptions, setRedemptions] = useState<Redemption[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalInfo, setModalInfo] = useState<{url: string} | null>(null);
    const [activeTab, setActiveTab] = useState<'coupons' | 'redemptions'>('coupons');

    const fetchData = useCallback(async () => {
        if (user) {
            setLoading(true);
            const [allCoupons, affiliateRedemptions] = await Promise.all([
                api.getAllCoupons(),
                api.getRedemptionsForAffiliate(user.id),
            ]);
            setCoupons(allCoupons);
            setRedemptions(affiliateRedemptions);
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    if (!user) return null;
    
    const totalPointsEarned = redemptions.reduce((sum, redemption) => sum + (redemption.commissionEarned || 0), 0);
    const totalExecutions = redemptions.length;

    const handleGetLink = (couponId: string) => {
        const url = `${window.location.origin}/#/coupon/${couponId}?affiliateId=${user.id}`;
        setModalInfo({ url });
    };

    return (
        <div className="space-y-8 animate-fadeIn">
            {modalInfo && <QRCodeModal url={modalInfo.url} onClose={() => setModalInfo(null)} />}
            
            <h1 className="text-3xl font-bold text-dark-gray">{t('affiliate.dashboardTitle')}</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title={t('affiliate.stats.totalPoints')} value={totalPointsEarned.toLocaleString()} icon={<BanknotesIcon className="h-6 w-6"/>} color="green" />
                <StatCard title={t('affiliate.stats.totalExecutions')} value={totalExecutions} icon={<CheckCircleIcon className="h-6 w-6"/>} color="blue" />
                <StatCard title="Customer Data Access" value={redemptions.length} icon={<CheckCircleIcon className="h-6 w-6"/>} color="purple" />
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
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">👥 Customer Redemption Data</h2>
                            <p className="text-gray-600">Complete customer information for all coupons you've promoted</p>
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
                                    {redemptions.map((redemption) => (
                                        <tr key={redemption.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900">
                                                    {redemption.redeemedAt ? new Date(redemption.redeemedAt).toLocaleDateString() : 'N/A'}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {redemption.redeemedAt ? new Date(redemption.redeemedAt).toLocaleTimeString() : 'N/A'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900">{redemption.couponTitle || 'N/A'}</div>
                                                <div className="text-xs text-gray-500">ID: {redemption.couponId?.slice(0, 8)}</div>
                                                <div className="text-xs text-blue-600">
                                                    {redemption.discountType === 'percentage' ? `${redemption.discountValue}% OFF` : `$${redemption.discountValue} OFF`}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {redemption.customerName || 'Anonymous Customer'}
                                                    </div>
                                                    <div className="text-xs text-gray-700">
                                                        📞 {redemption.customerPhone || 'No phone provided'}
                                                    </div>
                                                    <div className="text-xs text-gray-700">
                                                        ✉️ {redemption.customerEmail || 'No email provided'}
                                                    </div>
                                                    {redemption.customerAddress && (
                                                        <div className="text-xs text-gray-600">
                                                            📍 {redemption.customerAddress}
                                                        </div>
                                                    )}
                                                    {redemption.customerAge && (
                                                        <div className="text-xs text-gray-600">
                                                            👤 Age: {redemption.customerAge}, {redemption.customerGender || 'N/A'}
                                                        </div>
                                                    )}
                                                    <div className="text-xs text-blue-600">
                                                        User ID: {redemption.userId?.slice(0, 8)}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {redemption.shopOwnerName || 'Unknown Shop'}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    Shop ID: {redemption.shopOwnerId?.slice(0, 8)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-green-600">
                                                    💰 {redemption.commissionEarned || 0} credits
                                                </div>
                                                <div className="text-xs text-blue-600">
                                                    🎁 Customer earned: {redemption.customerRewardPoints || 0} points
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {redemptions.length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                    No redemptions yet. Start promoting coupons to see customer data here.
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {redemptions.length > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-blue-800 text-sm">
                                <strong>📊 Data Access:</strong> As an affiliate, you have full access to customer information for coupons you've promoted. This data helps you understand your audience and improve your marketing strategies.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AffiliateDashboard;