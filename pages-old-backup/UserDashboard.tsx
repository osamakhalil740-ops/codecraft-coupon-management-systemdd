import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Coupon, Redemption } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useRealTimeTracking } from '../hooks/useRealTimeTracking';
import CouponCard from '../components/CouponCard';
import StatCard from '../components/StatCard';
import { Link } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';
import { 
    GiftIcon, 
    ShoppingBagIcon, 
    StarIcon, 
    CreditCardIcon,
    SparklesIcon,
    ClockIcon 
} from '@heroicons/react/24/outline';
import { logger } from '../utils/logger';

const UserDashboard: React.FC = () => {
    const { user } = useAuth();
    const { t } = useTranslation();
    
    // Real-time tracking integration for customer activity
    const { trackingData, trackUserAction } = useRealTimeTracking(
        user?.roles || [], 
        user?.id
    );
    
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [myRedemptions, setMyRedemptions] = useState<Redemption[]>([]);
    const [loading, setLoading] = useState(true);

    // Real-time data integration for user's activity
    useEffect(() => {
        if (trackingData && trackingData.redemptions && trackingData.redemptions.length > 0 && user) {
            // Filter user's redemptions from real-time data
            const userRedemptions = trackingData.redemptions.filter(
                redemption => redemption.customerId === user.id || redemption.userId === user.id
            );
            setMyRedemptions(userRedemptions);
            logger.debug(`🔴 LIVE: User received ${userRedemptions.length} personal redemptions`);
        }
    }, [trackingData?.redemptions, user?.id]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [allCoupons, allRedemptions] = await Promise.all([
                    api.getAllCoupons(),
                    api.getAllRedemptions()
                ]);
                
                // Filter available coupons (not expired, has uses left)
                const availableCoupons = allCoupons.filter(coupon => {
                    const now = new Date();
                    let isExpired = false;
                    
                    if (coupon.validityType === 'expiryDate' && coupon.expiryDate) {
                        isExpired = new Date(coupon.expiryDate) < now;
                    } else if (coupon.validityType === 'days' && coupon.validityDays) {
                        const expiryDate = new Date(new Date(coupon.createdAt).getTime() + coupon.validityDays * 24 * 60 * 60 * 1000);
                        isExpired = expiryDate < now;
                    }
                    
                    return coupon.usesLeft > 0 && !isExpired;
                });
                
                // Filter user's redemptions - only set if real-time data hasn't arrived
                const userRedemptions = user ? allRedemptions.filter(r => r.customerId === user.id) : [];
                
                // Only set if real-time data hasn't arrived yet
                if (!trackingData || !trackingData.redemptions || trackingData.redemptions.length === 0) {
                    setMyRedemptions(userRedemptions);
                }
                
                setCoupons(availableCoupons);
            } catch (error) {
                logger.error("Failed to fetch data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    if (loading) {
        return <div className="text-center p-10">Loading your deals...</div>;
    }

    if (!user) return null;

    // Calculate customer stats
    const totalPointsEarned = myRedemptions.reduce((sum, r) => sum + (r.customerRewardEarned || 0), 0);
    const totalCouponsUsed = myRedemptions.length;
    const availableDeals = coupons.length;
    const recentRedemptions = myRedemptions.slice(0, 5);

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Customer Header */}
            <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-8 rounded-xl shadow-lg">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">🛍️ Customer Dashboard</h1>
                        <p className="text-green-100 mt-2">Hi {user.name}! Discover amazing deals and earn rewards.</p>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-green-200">Usable Balance</div>
                        <div className="text-4xl font-bold">{user.credits.toLocaleString()}</div>
                    </div>
                </div>
            </div>

            {/* Customer Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Reward Credits" 
                    value={`${totalPointsEarned.toLocaleString()}`}
                    icon={<StarIcon className="h-6 w-6"/>} 
                    color="yellow" 
                />
                <StatCard 
                    title="Deals Used" 
                    value={totalCouponsUsed}
                    icon={<ShoppingBagIcon className="h-6 w-6"/>} 
                    color="blue" 
                />
                <StatCard 
                    title="Available Deals" 
                    value={availableDeals}
                    icon={<GiftIcon className="h-6 w-6"/>} 
                    color="green" 
                />
                <StatCard 
                    title="Usable Balance" 
                    value={`${user.credits.toLocaleString()}`}
                    icon={<CreditCardIcon className="h-6 w-6"/>} 
                    color="purple" 
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Available Deals */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center gap-3">
                        <GiftIcon className="h-7 w-7 text-green-600" />
                        <h2 className="text-2xl font-semibold text-gray-800">Available Deals</h2>
                    </div>
                    
                    {coupons.length === 0 ? (
                        <div className="bg-white p-8 rounded-xl shadow-lg border text-center">
                            <GiftIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Deals Available</h3>
                            <p className="text-gray-600">Check back later for new exciting offers!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                            {coupons.slice(0, 6).map(coupon => (
                                <CouponCard key={coupon.id} coupon={coupon}>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Link 
                                            to={`/coupon/${coupon.id}`}
                                            className="bg-green-600 text-white font-bold py-2 px-3 rounded-lg hover:bg-green-700 transition-all text-center text-sm"
                                        >
                                            🎁 Get Deal
                                        </Link>
                                        <div className="bg-blue-100 text-blue-800 font-semibold py-2 px-3 rounded-lg text-center text-sm">
                                            +{coupon.customerRewardPoints || 0} credits
                                        </div>
                                    </div>
                                </CouponCard>
                            ))}
                        </div>
                    )}
                    
                    {coupons.length > 6 && (
                        <div className="text-center">
                            <button className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-all">
                                View All {coupons.length} Deals
                            </button>
                        </div>
                    )}
                </div>

                {/* Recent Activity & Rewards */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <ClockIcon className="h-7 w-7 text-blue-600" />
                        <h3 className="text-xl font-semibold text-gray-800">Recent Activity</h3>
                    </div>
                    
                    <div className="bg-white rounded-xl shadow-lg border">
                        {recentRedemptions.length > 0 ? (
                            <div className="divide-y divide-gray-200">
                                {recentRedemptions.map((redemption) => (
                                    <div key={redemption.id} className="p-4">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900">{redemption.couponTitle}</p>
                                                <p className="text-sm text-gray-500">
                                                    {new Date(redemption.redeemedAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    +{redemption.customerRewardEarned || 0} pts
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-gray-500">
                                <ShoppingBagIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                <p>No activity yet</p>
                                <p className="text-sm">Start using deals to earn rewards!</p>
                            </div>
                        )}
                    </div>

                    {/* Rewards Info */}
                    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-xl border border-yellow-200">
                        <h4 className="font-bold text-orange-900 mb-3">🌟 Rewards Program</h4>
                        <ul className="text-sm text-orange-800 space-y-2">
                            <li>• Earn credits with every deal</li>
                            <li>• Credits = Real usable balance</li>
                            <li>• Use balance for purchases/services</li>
                            <li>• Share deals with friends</li>
                        </ul>
                        <div className="mt-4 pt-3 border-t border-yellow-300">
                            <p className="text-xs text-orange-700">
                                You've earned <span className="font-bold">{totalPointsEarned}</span> credits total!
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserDashboard;