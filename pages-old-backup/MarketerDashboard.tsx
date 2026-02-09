import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Coupon, Redemption } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import StatCard from '../components/StatCard';
import CouponCard from '../components/CouponCard';
import QRCodeModal from '../components/QRCodeModal';
import { 
    CurrencyDollarIcon, 
    ChartBarIcon, 
    ShareIcon, 
    SparklesIcon,
    TrophyIcon,
    EyeIcon 
} from '@heroicons/react/24/outline';
import { logger } from '../utils/logger';

const MarketerDashboard: React.FC = () => {
    const { user } = useAuth();
    const { t } = useTranslation();
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [redemptions, setRedemptions] = useState<Redemption[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalInfo, setModalInfo] = useState<{url: string} | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            try {
                const [allCoupons, affiliateRedemptions] = await Promise.all([
                    api.getAllCoupons(),
                    api.getRedemptionsForAffiliate(user.id)
                ]);
                setCoupons(allCoupons);
                setRedemptions(affiliateRedemptions);
            } catch (error) {
                logger.error('Failed to fetch marketer data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    if (loading) {
        return <div className="text-center p-10">Loading your marketing dashboard...</div>;
    }

    if (!user) return null;

    // Calculate marketer stats
    const totalCommissionEarned = redemptions.reduce((sum, redemption) => 
        sum + (redemption.commissionEarned || 0), 0
    );
    const totalRedemptionsReferred = redemptions.length;
    const activeCampaigns = coupons.filter(c => c.usesLeft > 0 && c.affiliateCommission > 0).length;
    const averageCommission = totalRedemptionsReferred > 0 
        ? Math.round(totalCommissionEarned / totalRedemptionsReferred) 
        : 0;

    const handlePromoteCoupon = (couponId: string) => {
        const affiliateUrl = `${window.location.origin}/#/coupon/${couponId}?affiliateId=${user.id}`;
        setModalInfo({ url: affiliateUrl });
    };

    return (
        <div className="space-y-8 animate-fadeIn">
            {modalInfo && <QRCodeModal url={modalInfo.url} onClose={() => setModalInfo(null)} />}
            
            {/* Marketer Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-8 rounded-xl shadow-lg">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">🚀 Marketer Dashboard</h1>
                        <p className="text-purple-100 mt-2">Welcome back, {user.name}! Ready to earn commissions?</p>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-purple-200">Total Credits</div>
                        <div className="text-4xl font-bold">{user.credits.toLocaleString()}</div>
                    </div>
                </div>
            </div>

            {/* Marketing Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Commission Earned" 
                    value={`${totalCommissionEarned.toLocaleString()} credits`}
                    icon={<CurrencyDollarIcon className="h-6 w-6"/>} 
                    color="green" 
                />
                <StatCard 
                    title="Successful Referrals" 
                    value={totalRedemptionsReferred}
                    icon={<TrophyIcon className="h-6 w-6"/>} 
                    color="yellow" 
                />
                <StatCard 
                    title="Active Campaigns" 
                    value={activeCampaigns}
                    icon={<ChartBarIcon className="h-6 w-6"/>} 
                    color="blue" 
                />
                <StatCard 
                    title="Avg. Commission" 
                    value={`${averageCommission} credits`}
                    icon={<SparklesIcon className="h-6 w-6"/>} 
                    color="purple" 
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Available Campaigns */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center gap-3">
                        <ShareIcon className="h-7 w-7 text-purple-600" />
                        <h2 className="text-2xl font-semibold text-gray-800">Available Campaigns</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {coupons
                            .filter(coupon => coupon.usesLeft > 0 && coupon.affiliateCommission > 0)
                            .map(coupon => (
                                <CouponCard key={coupon.id} coupon={coupon} showAffiliateCommission={true}>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button 
                                            onClick={() => handlePromoteCoupon(coupon.id)}
                                            className="bg-purple-600 text-white font-bold py-2 px-3 rounded-lg hover:bg-purple-700 transition-all text-sm"
                                        >
                                            📢 Promote
                                        </button>
                                        <div className="bg-green-100 text-green-800 font-semibold py-2 px-3 rounded-lg text-center text-sm">
                                            +{coupon.affiliateCommission} credits
                                        </div>
                                    </div>
                                </CouponCard>
                            ))
                        }
                    </div>
                    
                    {coupons.filter(c => c.usesLeft > 0 && c.affiliateCommission > 0).length === 0 && (
                        <div className="bg-white p-8 rounded-xl shadow-lg border text-center">
                            <SparklesIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Active Campaigns</h3>
                            <p className="text-gray-600">Check back later for new promotional opportunities!</p>
                        </div>
                    )}
                </div>

                {/* Commission History */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <CurrencyDollarIcon className="h-7 w-7 text-green-600" />
                        <h3 className="text-xl font-semibold text-gray-800">Recent Earnings</h3>
                    </div>
                    
                    <div className="bg-white rounded-xl shadow-lg border max-h-96 overflow-y-auto">
                        {redemptions.length > 0 ? (
                            <div className="divide-y divide-gray-200">
                                {redemptions.slice(0, 10).map((redemption) => (
                                    <div key={redemption.id} className="p-4">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900">{redemption.couponTitle}</p>
                                                <p className="text-sm text-gray-500">
                                                    {new Date(redemption.redeemedAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    +{redemption.commissionEarned || 0}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-gray-500">
                                <CurrencyDollarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                <p>No earnings yet</p>
                                <p className="text-sm">Start promoting campaigns to earn commissions!</p>
                            </div>
                        )}
                    </div>

                    {/* Marketing Tips */}
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-200">
                        <h4 className="font-bold text-blue-900 mb-3">💡 Marketing Tips</h4>
                        <ul className="text-sm text-blue-800 space-y-2">
                            <li>• Share affiliate links on social media</li>
                            <li>• Target audiences interested in deals</li>
                            <li>• Use QR codes for offline promotion</li>
                            <li>• Focus on high-commission campaigns</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MarketerDashboard;