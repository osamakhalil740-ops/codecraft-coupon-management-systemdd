import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../services/api';
import { Shop, AdminCreditLog, Coupon, Redemption, Referral, Role, User } from '../types';
import { useAuth } from '../hooks/useAuth';
import StatCard from '../components/StatCard';
import {
    UserGroupIcon,
    BanknotesIcon,
    GiftIcon,
    TicketIcon,
    TrashIcon,
    EyeIcon,
    Cog6ToothIcon,
    AdjustmentsHorizontalIcon,
    TableCellsIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from '../hooks/useTranslation';

type AdminTab =
    | 'overview'
    | 'shops'
    | 'affiliates'
    | 'coupons'
    | 'redemptions'
    | 'referrals'
    | 'intelligence'
    | 'settings';

const AdminDashboard: React.FC = () => {
    const { user } = useAuth();
    const { t } = useTranslation();
    const [allUsers, setAllUsers] = useState<Shop[]>([]);
    const [allCoupons, setAllCoupons] = useState<Coupon[]>([]);
    const [creditLogs, setCreditLogs] = useState<AdminCreditLog[]>([]);
    const [redemptions, setRedemptions] = useState<Redemption[]>([]);
    const [referrals, setReferrals] = useState<Referral[]>([]);
    const [activeTab, setActiveTab] = useState<AdminTab>('overview');
    const [selectedUser, setSelectedUser] = useState<Shop | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [creditsInput, setCreditsInput] = useState('');
    const [rolesInput, setRolesInput] = useState<Role[]>([]);
    const [savingUser, setSavingUser] = useState(false);
    const [busy, setBusy] = useState(false);
    const [affiliateDetailsOpen, setAffiliateDetailsOpen] = useState(false);
    const [selectedAffiliate, setSelectedAffiliate] = useState<User | null>(null);
    const [systemActivity, setSystemActivity] = useState<any[]>([]);
    const [allCustomerData, setAllCustomerData] = useState<any[]>([]);
    const [intelligenceData, setIntelligenceData] = useState<any>({});

    const fetchData = useCallback(async () => {
        if (user?.roles.includes('admin')) {
            setBusy(true);
            try {
                const [fetchedUsers, fetchedCoupons, allCreditLogs, allRedemptions, allReferrals, activityData] = await Promise.all([
                api.getAllUsers(), 
                api.getAllCoupons(),
                    api.getAdminCreditLogs(),
                    api.getAllRedemptions(),
                    api.getAllReferrals(),
                    api.getSystemActivity()
            ]);
            setAllUsers(fetchedUsers);
            setAllCoupons(fetchedCoupons);
            setCreditLogs(allCreditLogs);
                setRedemptions(allRedemptions);
                setReferrals(allReferrals);
                setSystemActivity(activityData || []);
            } finally {
                setBusy(false);
            }
        }
    }, [user]);

    const fetchIntelligenceData = useCallback(async () => {
        if (user?.roles.includes('admin')) {
            setBusy(true);
            try {
                console.log('🔍 Fetching comprehensive intelligence data...');
                
                // Fetch all customer data from multiple sources
                const allShopIds = allUsers.filter(u => u.roles.includes('shop-owner')).map(u => u.id);
                const allAffiliateIds = allUsers.filter(u => u.roles.includes('affiliate')).map(u => u.id);
                
                const [shopCustomerData, affiliateCustomerData] = await Promise.all([
                    Promise.all(allShopIds.map(shopId => api.getCustomerDataForShop(shopId))),
                    Promise.all(allAffiliateIds.map(affiliateId => api.getCustomerDataForAffiliate(affiliateId)))
                ]);
                
                // Flatten and combine customer data
                const allCustomers = [
                    ...shopCustomerData.flat(),
                    ...affiliateCustomerData.flat()
                ];
                
                // Deduplicate customer data
                const uniqueCustomers = allCustomers.reduce((unique, customer) => {
                    const key = `${customer.couponId}-${customer.userId}`;
                    if (!unique.find(item => `${item.couponId}-${item.userId}` === key)) {
                        unique.push(customer);
                    }
                    return unique;
                }, [] as any[]);
                
                setAllCustomerData(uniqueCustomers);
                
                // Calculate intelligence insights
                const intelligence = calculateIntelligenceInsights(uniqueCustomers, allUsers, allCoupons, redemptions);
                setIntelligenceData(intelligence);
                
                console.log(`📊 Intelligence data compiled: ${uniqueCustomers.length} customers, ${Object.keys(intelligence).length} insights`);
                
            } catch (error) {
                console.error('❌ Error fetching intelligence data:', error);
            } finally {
                setBusy(false);
            }
        }
    }, [user, allUsers, allCoupons, redemptions]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (activeTab === 'intelligence' && allUsers.length > 0) {
            fetchIntelligenceData();
        }
    }, [activeTab, allUsers.length, fetchIntelligenceData]);

    // Advanced Intelligence calculation function
    const calculateIntelligenceInsights = (customers: any[], users: any[], coupons: any[], redemptions: any[]) => {
        const shopOwners = users.filter(u => u.roles.includes('shop-owner'));
        const affiliates = users.filter(u => u.roles.includes('affiliate'));
        
        // 1. Complete Shop Insights
        const shopInsights = shopOwners.map(shop => {
            const shopCoupons = coupons.filter(c => c.shopOwnerId === shop.id);
            const shopRedemptions = redemptions.filter(r => r.shopOwnerId === shop.id);
            const shopCustomers = customers.filter(c => c.shopOwnerId === shop.id);
            
            // Affiliate performance for this shop
            const affiliatePerformance = affiliates.map(affiliate => {
                const affiliateRedemptions = shopRedemptions.filter(r => r.affiliateId === affiliate.id);
                const affiliateCustomers = shopCustomers.filter(c => c.affiliateId === affiliate.id);
                return {
                    affiliateId: affiliate.id,
                    affiliateName: affiliate.name,
                    redemptions: affiliateRedemptions.length,
                    customers: affiliateCustomers.length,
                    commissionsPaid: affiliateRedemptions.reduce((sum, r) => sum + (r.commissionEarned || 0), 0),
                    conversionRate: affiliateRedemptions.length > 0 ? ((affiliateRedemptions.length / Math.max(1, affiliateCustomers.length)) * 100).toFixed(2) : '0'
                };
            }).filter(perf => perf.redemptions > 0);

            // Coupon performance for this shop
            const couponPerformance = shopCoupons.map(coupon => {
                const couponRedemptions = shopRedemptions.filter(r => r.couponId === coupon.id);
                const couponCustomers = shopCustomers.filter(c => c.couponId === coupon.id);
                const affiliateRedemptions = couponRedemptions.filter(r => r.affiliateId);
                
                return {
                    couponId: coupon.id,
                    couponTitle: coupon.title,
                    totalRedemptions: couponRedemptions.length,
                    uniqueCustomers: [...new Set(couponCustomers.map(c => c.userId))].length,
                    affiliatePromoted: [...new Set(affiliateRedemptions.map(r => r.affiliateId))].length,
                    directRedemptions: couponRedemptions.length - affiliateRedemptions.length,
                    affiliateRedemptions: affiliateRedemptions.length,
                    totalRevenue: couponRedemptions.reduce((sum, r) => sum + (r.discountValue || 0), 0),
                    conversionRate: coupon.clicks ? ((couponRedemptions.length / coupon.clicks) * 100).toFixed(2) : 'N/A'
                };
            });

            return {
                shopId: shop.id,
                shopName: shop.name,
                shopEmail: shop.email,
                shopCredits: shop.credits,
                totalCoupons: shopCoupons.length,
                totalRedemptions: shopRedemptions.length,
                uniqueCustomers: [...new Set(shopCustomers.map(c => c.userId))].length,
                totalRevenue: shopRedemptions.reduce((sum, r) => sum + (r.discountValue || 0), 0),
                totalCommissionsPaid: shopRedemptions.reduce((sum, r) => sum + (r.commissionEarned || 0), 0),
                affiliatePartnerships: affiliatePerformance.length,
                directVsAffiliate: {
                    direct: shopRedemptions.filter(r => !r.affiliateId).length,
                    affiliate: shopRedemptions.filter(r => r.affiliateId).length
                },
                topPerformingCoupons: couponPerformance.sort((a, b) => b.totalRedemptions - a.totalRedemptions).slice(0, 5),
                affiliatePerformance: affiliatePerformance.sort((a, b) => b.redemptions - a.redemptions),
                growthMetrics: calculateShopGrowth(shopRedemptions, shopCustomers)
            };
        });

        // 2. Complete Affiliate Insights  
        const affiliateInsights = affiliates.map(affiliate => {
            const affiliateRedemptions = redemptions.filter(r => r.affiliateId === affiliate.id);
            const affiliateCustomers = customers.filter(c => c.affiliateId === affiliate.id);
            
            // Shops this affiliate has worked with
            const shopsWorkedWith = [...new Set(affiliateRedemptions.map(r => r.shopOwnerId))].map(shopId => {
                const shop = shopOwners.find(s => s.id === shopId);
                const shopRedemptions = affiliateRedemptions.filter(r => r.shopOwnerId === shopId);
                return {
                    shopId,
                    shopName: shop?.name || 'Unknown',
                    redemptions: shopRedemptions.length,
                    commissionEarned: shopRedemptions.reduce((sum, r) => sum + (r.commissionEarned || 0), 0),
                    customers: affiliateCustomers.filter(c => c.shopOwnerId === shopId).length
                };
            });

            // Coupons this affiliate has promoted
            const couponsPromoted = [...new Set(affiliateRedemptions.map(r => r.couponId))].map(couponId => {
                const coupon = coupons.find(c => c.id === couponId);
                const couponRedemptions = affiliateRedemptions.filter(r => r.couponId === couponId);
                return {
                    couponId,
                    couponTitle: coupon?.title || 'Unknown',
                    shopName: coupon?.shopOwnerName || 'Unknown',
                    redemptions: couponRedemptions.length,
                    customers: [...new Set(couponRedemptions.map(r => r.customerId))].length,
                    commissionEarned: couponRedemptions.reduce((sum, r) => sum + (r.commissionEarned || 0), 0),
                    conversionRate: coupon?.clicks ? ((couponRedemptions.length / coupon.clicks) * 100).toFixed(2) : 'N/A'
                };
            });

            return {
                affiliateId: affiliate.id,
                affiliateName: affiliate.name,
                affiliateEmail: affiliate.email,
                affiliateCredits: affiliate.credits,
                totalCouponsPromoted: couponsPromoted.length,
                totalRedemptions: affiliateRedemptions.length,
                totalCustomers: [...new Set(affiliateCustomers.map(c => c.userId))].length,
                totalCommissionsEarned: affiliateRedemptions.reduce((sum, r) => sum + (r.commissionEarned || 0), 0),
                shopsWorkedWith: shopsWorkedWith.length,
                averageCommissionPerRedemption: affiliateRedemptions.length > 0 ? (affiliateRedemptions.reduce((sum, r) => sum + (r.commissionEarned || 0), 0) / affiliateRedemptions.length).toFixed(2) : '0',
                customerQuality: {
                    verified: affiliateCustomers.filter(c => c.isVerifiedCustomer).length,
                    completeProfiles: affiliateCustomers.filter(c => c.hasCompleteProfile).length,
                    qualityScore: affiliateCustomers.length > 0 ? ((affiliateCustomers.filter(c => c.isVerifiedCustomer).length / affiliateCustomers.length) * 100).toFixed(2) : '0'
                },
                detailedShopsPerformance: shopsWorkedWith,
                detailedCouponsPerformance: couponsPromoted.sort((a, b) => b.redemptions - a.redemptions),
                performanceMetrics: calculateAffiliatePerformance(affiliateRedemptions, affiliateCustomers)
            };
        });

        // 3. Full Customer Activity Analytics
        const customerActivity = customers.map(customer => ({
            customerId: customer.userId,
            customerName: customer.customerName,
            customerEmail: customer.customerEmail,
            customerPhone: customer.customerPhone,
            totalRedemptions: customers.filter(c => c.userId === customer.userId).length,
            shopsVisited: [...new Set(customers.filter(c => c.userId === customer.userId).map(c => c.shopOwnerId))].length,
            affiliatesUsed: [...new Set(customers.filter(c => c.userId === customer.userId).map(c => c.affiliateId).filter(Boolean))].length,
            totalSavings: customers.filter(c => c.userId === customer.userId).reduce((sum, c) => sum + (c.discountValue || 0), 0),
            lastActivity: Math.max(...customers.filter(c => c.userId === customer.userId).map(c => new Date(c.redeemedAt).getTime())),
            acquisitionSource: customer.affiliateId ? 'Affiliate' : 'Direct',
            isVerified: customer.isVerifiedCustomer,
            hasCompleteProfile: customer.hasCompleteProfile,
            redemptionHistory: customers.filter(c => c.userId === customer.userId).map(c => ({
                couponId: c.couponId,
                couponTitle: c.couponTitle,
                shopName: c.shopOwnerName,
                affiliateName: c.affiliateName || 'Direct',
                redeemedAt: c.redeemedAt,
                discountValue: c.discountValue,
                timestamp: c.redeemedAt
            }))
        }));

        // Remove duplicates and sort by activity
        const uniqueCustomers = customerActivity.reduce((unique, customer) => {
            const existing = unique.find(c => c.customerId === customer.customerId);
            if (!existing) {
                unique.push(customer);
            }
            return unique;
        }, [] as any[]).sort((a, b) => b.totalRedemptions - a.totalRedemptions);

        // 4. Global System Analytics
        const globalAnalytics = {
            totalShops: shopOwners.length,
            activeShops: shopInsights.filter(s => s.totalRedemptions > 0).length,
            totalAffiliates: affiliates.length,
            activeAffiliates: affiliateInsights.filter(a => a.totalRedemptions > 0).length,
            totalCoupons: coupons.length,
            activeCoupons: [...new Set(redemptions.map(r => r.couponId))].length,
            totalRedemptions: redemptions.length,
            totalUniqueCustomers: uniqueCustomers.length,
            totalRevenue: redemptions.reduce((sum, r) => sum + (r.discountValue || 0), 0),
            totalCommissions: redemptions.reduce((sum, r) => sum + (r.commissionEarned || 0), 0),
            networkEfficiency: redemptions.length > 0 ? ((redemptions.filter(r => r.affiliateId).length / redemptions.length) * 100).toFixed(2) : '0',
            topPerformingShops: shopInsights.sort((a, b) => b.totalRedemptions - a.totalRedemptions).slice(0, 10),
            topPerformingAffiliates: affiliateInsights.sort((a, b) => b.totalRedemptions - a.totalRedemptions).slice(0, 10),
            topPerformingCoupons: getTopPerformingCoupons(coupons, redemptions),
            systemHealth: calculateSystemHealth(shopInsights, affiliateInsights, uniqueCustomers),
            dailyWeeklyMonthlyMetrics: calculateTimeBasedMetrics(redemptions, customers),
            revenuePayoutTracking: calculateRevenueTracking(redemptions)
        };

        return {
            shopInsights: shopInsights.sort((a, b) => b.totalRedemptions - a.totalRedemptions),
            affiliateInsights: affiliateInsights.sort((a, b) => b.totalRedemptions - a.totalRedemptions),
            customerActivity: uniqueCustomers,
            globalAnalytics,
            lastUpdated: new Date().toISOString()
        };
    };

    // Helper functions for advanced calculations
    const calculateShopGrowth = (redemptions: any[], customers: any[]) => {
        const now = new Date();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        return {
            monthlyRedemptions: redemptions.filter(r => new Date(r.redeemedAt) > lastMonth).length,
            weeklyRedemptions: redemptions.filter(r => new Date(r.redeemedAt) > lastWeek).length,
            monthlyNewCustomers: customers.filter(c => new Date(c.redeemedAt) > lastMonth).length
        };
    };

    const calculateAffiliatePerformance = (redemptions: any[], customers: any[]) => {
        return {
            avgRedemptionsPerDay: redemptions.length / Math.max(1, 30), // Last 30 days average
            customerRetentionRate: customers.filter(c => c.hasCompleteProfile).length / Math.max(1, customers.length) * 100,
            networkGrowthRate: redemptions.length > 0 ? 'Positive' : 'Starting'
        };
    };

    const getTopPerformingCoupons = (coupons: any[], redemptions: any[]) => {
        return coupons.map(coupon => {
            const couponRedemptions = redemptions.filter(r => r.couponId === coupon.id);
            return {
                ...coupon,
                redemptionCount: couponRedemptions.length,
                conversionRate: coupon.clicks ? ((couponRedemptions.length / coupon.clicks) * 100).toFixed(2) : 'N/A',
                totalCommissions: couponRedemptions.reduce((sum, r) => sum + (r.commissionEarned || 0), 0)
            };
        }).sort((a, b) => b.redemptionCount - a.redemptionCount).slice(0, 10);
    };

    const calculateSystemHealth = (shops: any[], affiliates: any[], customers: any[]) => {
        const activeShops = shops.filter(s => s.totalRedemptions > 0).length;
        const activeAffiliates = affiliates.filter(a => a.totalRedemptions > 0).length;
        const healthScore = ((activeShops / Math.max(1, shops.length)) + (activeAffiliates / Math.max(1, affiliates.length))) * 50;

        return {
            healthScore: healthScore.toFixed(1),
            activeShopsPercent: shops.length > 0 ? ((activeShops / shops.length) * 100).toFixed(1) : '0',
            activeAffiliatesPercent: affiliates.length > 0 ? ((activeAffiliates / affiliates.length) * 100).toFixed(1) : '0',
            customerSatisfaction: customers.length > 0 ? ((customers.filter(c => c.isVerified).length / customers.length) * 100).toFixed(1) : '0'
        };
    };

    const calculateTimeBasedMetrics = (redemptions: any[], customers: any[]) => {
        const now = new Date();
        const periods = {
            today: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
            week: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
            month: new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
        };

        return {
            daily: {
                redemptions: redemptions.filter(r => new Date(r.redeemedAt) > periods.today).length,
                newCustomers: customers.filter(c => new Date(c.redeemedAt) > periods.today).length
            },
            weekly: {
                redemptions: redemptions.filter(r => new Date(r.redeemedAt) > periods.week).length,
                newCustomers: customers.filter(c => new Date(c.redeemedAt) > periods.week).length
            },
            monthly: {
                redemptions: redemptions.filter(r => new Date(r.redeemedAt) > periods.month).length,
                newCustomers: customers.filter(c => new Date(c.redeemedAt) > periods.month).length
            }
        };
    };

    const calculateRevenueTracking = (redemptions: any[]) => {
        return {
            totalDiscountsGiven: redemptions.reduce((sum, r) => sum + (r.discountValue || 0), 0),
            totalCommissionsPaid: redemptions.reduce((sum, r) => sum + (r.commissionEarned || 0), 0),
            netPlatformImpact: redemptions.reduce((sum, r) => sum + (r.discountValue || 0) - (r.commissionEarned || 0), 0),
            avgRevenuePerRedemption: redemptions.length > 0 ? (redemptions.reduce((sum, r) => sum + (r.discountValue || 0), 0) / redemptions.length).toFixed(2) : '0'
        };
    };

    if (!user) return null;

    const tabs: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
        { id: 'overview', label: 'Overview', icon: <TableCellsIcon className="h-4 w-4" /> },
        { id: 'shops', label: 'Shop Owners', icon: <UserGroupIcon className="h-4 w-4" /> },
        { id: 'affiliates', label: 'Affiliates', icon: <AdjustmentsHorizontalIcon className="h-4 w-4" /> },
        { id: 'coupons', label: 'Coupons', icon: <TicketIcon className="h-4 w-4" /> },
        { id: 'redemptions', label: 'Redemptions', icon: <BanknotesIcon className="h-4 w-4" /> },
        { id: 'referrals', label: 'Referrals', icon: <GiftIcon className="h-4 w-4" /> },
        { id: 'intelligence', label: 'Data Intelligence Center', icon: <TableCellsIcon className="h-4 w-4" /> },
        { id: 'settings', label: 'System Settings', icon: <Cog6ToothIcon className="h-4 w-4" /> }
    ];

    const tabButtonClass = (tabId: AdminTab) => {
        const isActive = activeTab === tabId;
        return `px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${
            isActive
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
        }`;
    };

    // Auto-load intelligence data on page load
    useEffect(() => {
        if (allUsers.length > 0 && allCoupons.length > 0) {
            fetchIntelligenceData();
        }
    }, [allUsers.length, allCoupons.length, fetchIntelligenceData]);

    // Overview content with Data Intelligence Section
    const overviewContent = (
        <div className="space-y-8">
            {/* Basic Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Total Users" 
                    value={allUsers.length.toString()} 
                    icon={<UserGroupIcon className="h-6 w-6" />} 
                    color="blue" 
                />
                <StatCard 
                    title="Total Coupons" 
                    value={allCoupons.length.toString()} 
                    icon={<TicketIcon className="h-6 w-6" />} 
                    color="green" 
                />
                <StatCard 
                    title="Total Redemptions" 
                    value={redemptions.length.toString()} 
                    icon={<BanknotesIcon className="h-6 w-6" />} 
                    color="purple" 
                />
                <StatCard 
                    title="Total Referrals" 
                    value={referrals.length.toString()} 
                    icon={<GiftIcon className="h-6 w-6" />} 
                    color="orange" 
                />
            </div>

            {/* DATA INTELLIGENCE SECTION - VISIBLE IMMEDIATELY */}
            <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white p-8 rounded-xl shadow-lg">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-bold mb-2">🧠 Data Intelligence Center</h2>
                        <p className="text-purple-100">Complete system-wide analytics and insights dashboard</p>
                        <p className="text-sm text-blue-200 mt-1">
                            Last updated: {intelligenceData.lastUpdated ? new Date(intelligenceData.lastUpdated).toLocaleString() : 'Loading...'}
                        </p>
                    </div>
                    <div className="text-right">
                        <button
                            onClick={fetchIntelligenceData}
                            disabled={busy}
                            className="px-6 py-3 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-lg transition-all font-medium"
                        >
                            {busy ? '🔄 Loading...' : '🔄 Refresh Data'}
                        </button>
                    </div>
                </div>
            </div>

            {busy && (
                <div className="text-center py-12">
                    <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
                    <p className="mt-4 text-gray-600">Loading comprehensive intelligence data...</p>
                </div>
            )}

            {intelligenceData.globalAnalytics && (
                <>
                    {/* Global System Health Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-blue-100 text-sm">System Health</p>
                                    <p className="text-3xl font-bold">{intelligenceData.globalAnalytics.systemHealth.healthScore}%</p>
                                </div>
                                <div className="text-blue-200">💚</div>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-green-100 text-sm">Network Efficiency</p>
                                    <p className="text-3xl font-bold">{intelligenceData.globalAnalytics.networkEfficiency}%</p>
                                </div>
                                <div className="text-green-200">📈</div>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-purple-100 text-sm">Total Revenue</p>
                                    <p className="text-3xl font-bold">${intelligenceData.globalAnalytics.totalRevenue.toLocaleString()}</p>
                                </div>
                                <div className="text-purple-200">💰</div>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-xl">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-orange-100 text-sm">Total Customers</p>
                                    <p className="text-3xl font-bold">{intelligenceData.globalAnalytics.totalUniqueCustomers.toLocaleString()}</p>
                                </div>
                                <div className="text-orange-200">👥</div>
                            </div>
                        </div>
                    </div>

                    {/* Complete Shop Insights Table */}
                    <div className="bg-white rounded-xl shadow-lg border overflow-hidden">
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 border-b">
                            <h3 className="text-2xl font-bold text-gray-800 mb-2">🏪 Complete Shop Insights</h3>
                            <p className="text-gray-600">Comprehensive analysis of all shop owner performance and customer acquisition</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-xs text-gray-700 uppercase">
                                    <tr>
                                        <th className="px-6 py-3 text-left">Shop Details</th>
                                        <th className="px-6 py-3 text-left">Coupon Performance</th>
                                        <th className="px-6 py-3 text-left">Customer Analytics</th>
                                        <th className="px-6 py-3 text-left">Affiliate Network</th>
                                        <th className="px-6 py-3 text-left">Revenue & Growth</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {intelligenceData.shopInsights?.slice(0, 5).map((shop: any) => (
                                        <tr key={shop.shopId} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="font-medium text-gray-900">{shop.shopName}</div>
                                                    <div className="text-xs text-gray-500">{shop.shopEmail}</div>
                                                    <div className="text-xs text-blue-600">{shop.shopCredits?.toLocaleString() || 0} credits</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="text-sm">📊 {shop.totalCoupons} coupons</div>
                                                    <div className="text-sm">🎯 {shop.totalRedemptions} redemptions</div>
                                                    <div className="text-xs text-green-600">Best: {shop.topPerformingCoupons?.[0]?.couponTitle || 'N/A'}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="text-sm">👥 {shop.uniqueCustomers} customers</div>
                                                    <div className="text-xs text-blue-600">📈 {shop.directVsAffiliate?.direct || 0} direct</div>
                                                    <div className="text-xs text-purple-600">🤝 {shop.directVsAffiliate?.affiliate || 0} via affiliates</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="text-sm">🤝 {shop.affiliatePartnerships} partners</div>
                                                    <div className="text-xs text-green-600">💰 ${shop.totalCommissionsPaid?.toLocaleString() || 0} paid</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="text-sm font-medium text-green-600">${shop.totalRevenue?.toLocaleString() || 0}</div>
                                                    <div className="text-xs text-blue-600">Net: ${((shop.totalRevenue || 0) - (shop.totalCommissionsPaid || 0)).toLocaleString()}</div>
                                                    <div className={`text-xs ${(shop.totalRevenue || 0) > (shop.totalCommissionsPaid || 0) ? 'text-green-600' : 'text-orange-600'}`}>
                                                        {(shop.totalRevenue || 0) > (shop.totalCommissionsPaid || 0) ? '✅ Profitable' : '📈 Building'}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Complete Affiliate Insights Table */}
                    <div className="bg-white rounded-xl shadow-lg border overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b">
                            <h3 className="text-2xl font-bold text-gray-800 mb-2">📈 Complete Affiliate Insights</h3>
                            <p className="text-gray-600">Comprehensive analysis of affiliate performance and customer acquisition</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-xs text-gray-700 uppercase">
                                    <tr>
                                        <th className="px-6 py-3 text-left">Affiliate Details</th>
                                        <th className="px-6 py-3 text-left">Promotion Activity</th>
                                        <th className="px-6 py-3 text-left">Customer Quality</th>
                                        <th className="px-6 py-3 text-left">Network Reach</th>
                                        <th className="px-6 py-3 text-left">Earnings</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {intelligenceData.affiliateInsights?.slice(0, 5).map((affiliate: any) => (
                                        <tr key={affiliate.affiliateId} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="font-medium text-gray-900">{affiliate.affiliateName}</div>
                                                    <div className="text-xs text-gray-500">{affiliate.affiliateEmail}</div>
                                                    <div className="text-xs text-blue-600">{affiliate.affiliateCredits?.toLocaleString() || 0} credits</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="text-sm">🎫 {affiliate.totalCouponsPromoted} coupons</div>
                                                    <div className="text-sm">✅ {affiliate.totalRedemptions} conversions</div>
                                                    <div className="text-xs text-gray-600">Avg: {affiliate.performanceMetrics?.avgRedemptionsPerDay?.toFixed(1) || '0'}/day</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="text-sm">👥 {affiliate.totalCustomers} customers</div>
                                                    <div className="text-xs text-green-600">✅ {affiliate.customerQuality?.verified || 0} verified</div>
                                                    <div className="text-xs text-blue-600">📋 {affiliate.customerQuality?.completeProfiles || 0} complete</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="text-sm">🏪 {affiliate.shopsWorkedWith} shops</div>
                                                    <div className="text-xs text-purple-600">Best: {affiliate.detailedShopsPerformance?.[0]?.shopName || 'N/A'}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="text-sm font-medium text-green-600">💰 ${affiliate.totalCommissionsEarned?.toLocaleString() || 0}</div>
                                                    <div className="text-xs text-gray-600">Avg: ${affiliate.averageCommissionPerRedemption || 0}</div>
                                                    <div className="text-xs text-blue-600">Status: {affiliate.performanceMetrics?.networkGrowthRate || 'Starting'}</div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Full Customer Activity Table */}
                    <div className="bg-white rounded-xl shadow-lg border overflow-hidden">
                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 border-b">
                            <h3 className="text-2xl font-bold text-gray-800 mb-2">👥 Full Customer Activity</h3>
                            <p className="text-gray-600">Complete customer behavior and cross-shop activity analysis</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-xs text-gray-700 uppercase">
                                    <tr>
                                        <th className="px-6 py-3 text-left">Customer Details</th>
                                        <th className="px-6 py-3 text-left">Activity Summary</th>
                                        <th className="px-6 py-3 text-left">Network Engagement</th>
                                        <th className="px-6 py-3 text-left">Value & Behavior</th>
                                        <th className="px-6 py-3 text-left">Last Activity</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {intelligenceData.customerActivity?.slice(0, 8).map((customer: any) => (
                                        <tr key={customer.customerId} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="font-medium text-gray-900">{customer.customerName || 'Anonymous'}</div>
                                                    <div className="text-xs text-gray-500">{customer.customerEmail || 'No email'}</div>
                                                    <div className="text-xs text-blue-600">{customer.customerPhone || 'No phone'}</div>
                                                    <div className={`text-xs ${customer.isVerified ? 'text-green-600' : 'text-orange-600'}`}>
                                                        {customer.isVerified ? '✅ Verified' : '⏳ Unverified'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="text-sm">🎫 {customer.totalRedemptions} redemptions</div>
                                                    <div className="text-xs text-blue-600">💰 ${customer.totalSavings?.toLocaleString() || 0} saved</div>
                                                    <div className="text-xs text-gray-600">Source: {customer.acquisitionSource}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="text-sm">🏪 {customer.shopsVisited} shops visited</div>
                                                    <div className="text-xs text-purple-600">🤝 {customer.affiliatesUsed} affiliates used</div>
                                                    <div className="text-xs text-gray-600">Cross-shop: {customer.shopsVisited > 1 ? 'Active' : 'Single shop'}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="text-sm">Avg: ${((customer.totalSavings || 0) / Math.max(1, customer.totalRedemptions)).toFixed(2)}</div>
                                                    <div className="text-xs text-green-600">Value: {(customer.totalSavings || 0) > 100 ? 'High' : (customer.totalSavings || 0) > 50 ? 'Medium' : 'New'}</div>
                                                    <div className={`text-xs ${customer.hasCompleteProfile ? 'text-green-600' : 'text-orange-600'}`}>
                                                        Profile: {customer.hasCompleteProfile ? 'Complete' : 'Incomplete'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="text-sm">{new Date(customer.lastActivity).toLocaleDateString()}</div>
                                                    <div className="text-xs text-gray-500">{new Date(customer.lastActivity).toLocaleTimeString()}</div>
                                                    <div className="text-xs text-blue-600">
                                                        {Math.floor((Date.now() - customer.lastActivity) / (1000 * 60 * 60 * 24))} days ago
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Global Performance Metrics */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white rounded-xl shadow-lg border p-6">
                            <h4 className="text-xl font-bold text-gray-800 mb-4">📊 Performance Trends</h4>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="text-center p-4 bg-blue-50 rounded-lg">
                                    <div className="text-2xl font-bold text-blue-600">{intelligenceData.globalAnalytics.dailyWeeklyMonthlyMetrics?.daily?.redemptions || 0}</div>
                                    <div className="text-sm text-blue-800">Today</div>
                                </div>
                                <div className="text-center p-4 bg-green-50 rounded-lg">
                                    <div className="text-2xl font-bold text-green-600">{intelligenceData.globalAnalytics.dailyWeeklyMonthlyMetrics?.weekly?.redemptions || 0}</div>
                                    <div className="text-sm text-green-800">This Week</div>
                                </div>
                                <div className="text-center p-4 bg-purple-50 rounded-lg">
                                    <div className="text-2xl font-bold text-purple-600">{intelligenceData.globalAnalytics.dailyWeeklyMonthlyMetrics?.monthly?.redemptions || 0}</div>
                                    <div className="text-sm text-purple-800">This Month</div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-xl shadow-lg border p-6">
                            <h4 className="text-xl font-bold text-gray-800 mb-4">💰 Revenue/Payout Tracking</h4>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Total Discounts:</span>
                                    <span className="font-semibold text-red-600">${intelligenceData.globalAnalytics.revenuePayoutTracking?.totalDiscountsGiven?.toLocaleString() || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Total Commissions:</span>
                                    <span className="font-semibold text-orange-600">${intelligenceData.globalAnalytics.revenuePayoutTracking?.totalCommissionsPaid?.toLocaleString() || 0}</span>
                                </div>
                                <div className="flex justify-between border-t pt-2">
                                    <span className="text-gray-600">Net Impact:</span>
                                    <span className="font-semibold text-green-600">${intelligenceData.globalAnalytics.revenuePayoutTracking?.netPlatformImpact?.toLocaleString() || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {!intelligenceData.globalAnalytics && !busy && (
                <div className="bg-white rounded-xl shadow-lg border p-8 text-center">
                    <div className="text-gray-400 text-6xl mb-4">📊</div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Loading Intelligence Data...</h3>
                    <p className="text-gray-600 mb-4">Click "Refresh Data" to load comprehensive analytics</p>
                    <button
                        onClick={fetchIntelligenceData}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all font-medium"
                    >
                        🔄 Load Intelligence Data
                    </button>
                </div>
            )}
        </div>
    );

    // Complete Data Intelligence Center Content
    const intelligenceContent = (
        <div className="space-y-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white p-8 rounded-xl shadow-lg">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-bold mb-2">🧠 Data Intelligence Center</h1>
                        <p className="text-purple-100">Complete system-wide analytics and insights dashboard</p>
                        <p className="text-sm text-blue-200 mt-1">
                            Last updated: {intelligenceData.lastUpdated ? new Date(intelligenceData.lastUpdated).toLocaleString() : 'Not loaded'}
                        </p>
                    </div>
                    <div className="text-right">
                        <button
                            onClick={fetchIntelligenceData}
                            disabled={busy}
                            className="px-6 py-3 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-lg transition-all font-medium"
                        >
                            {busy ? '🔄 Loading...' : '🔄 Refresh Data'}
                        </button>
                    </div>
                </div>
            </div>

            {busy && (
                <div className="text-center py-12">
                    <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
                    <p className="mt-4 text-gray-600">Loading comprehensive intelligence data...</p>
                </div>
            )}

            {!busy && intelligenceData.globalAnalytics && (
                <>
                    {/* Global System Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-blue-100 text-sm">Total System Health</p>
                                    <p className="text-3xl font-bold">{intelligenceData.globalAnalytics.systemHealth.healthScore}%</p>
                                </div>
                                <div className="text-blue-200">💚</div>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-green-100 text-sm">Network Efficiency</p>
                                    <p className="text-3xl font-bold">{intelligenceData.globalAnalytics.networkEfficiency}%</p>
                                </div>
                                <div className="text-green-200">📈</div>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-purple-100 text-sm">Total Revenue Impact</p>
                                    <p className="text-3xl font-bold">${intelligenceData.globalAnalytics.totalRevenue.toLocaleString()}</p>
                                </div>
                                <div className="text-purple-200">💰</div>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-xl">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-orange-100 text-sm">Unique Customers</p>
                                    <p className="text-3xl font-bold">{intelligenceData.globalAnalytics.totalUniqueCustomers.toLocaleString()}</p>
                                </div>
                                <div className="text-orange-200">👥</div>
                            </div>
                        </div>
                    </div>

                    {/* Complete Shop Insights */}
                    <div className="bg-white rounded-xl shadow-lg border overflow-hidden">
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 border-b">
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">🏪 Complete Shop Insights</h2>
                            <p className="text-gray-600">Comprehensive analysis of all shop owner performance and customer acquisition</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-xs text-gray-700 uppercase">
                                    <tr>
                                        <th className="px-6 py-3 text-left">Shop Details</th>
                                        <th className="px-6 py-3 text-left">Coupon Performance</th>
                                        <th className="px-6 py-3 text-left">Customer Analytics</th>
                                        <th className="px-6 py-3 text-left">Affiliate Network</th>
                                        <th className="px-6 py-3 text-left">Revenue & Growth</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {intelligenceData.shopInsights?.slice(0, 10).map((shop: any, index: number) => (
                                        <tr key={shop.shopId} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="font-medium text-gray-900">{shop.shopName}</div>
                                                    <div className="text-xs text-gray-500">{shop.shopEmail}</div>
                                                    <div className="text-xs text-blue-600">{shop.shopCredits.toLocaleString()} credits</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="text-sm">📊 {shop.totalCoupons} coupons created</div>
                                                    <div className="text-sm">🎯 {shop.totalRedemptions} total redemptions</div>
                                                    <div className="text-xs text-gray-600">Best: {shop.topPerformingCoupons[0]?.couponTitle || 'N/A'}</div>
                                                    <div className="text-xs text-green-600">Top conv: {shop.topPerformingCoupons[0]?.conversionRate || '0'}%</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="text-sm">👥 {shop.uniqueCustomers} unique customers</div>
                                                    <div className="text-xs text-blue-600">📈 {shop.directVsAffiliate.direct} direct</div>
                                                    <div className="text-xs text-purple-600">🤝 {shop.directVsAffiliate.affiliate} via affiliates</div>
                                                    <div className="text-xs text-green-600">Growth: {shop.growthMetrics.monthlyNewCustomers}/month</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="text-sm">🤝 {shop.affiliatePartnerships} active partners</div>
                                                    <div className="text-xs text-green-600">💰 {shop.totalCommissionsPaid.toLocaleString()} paid out</div>
                                                    <div className="text-xs text-gray-600">Network: {shop.affiliatePartnerships > 3 ? 'Strong' : shop.affiliatePartnerships > 0 ? 'Growing' : 'Direct only'}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="text-sm font-medium text-green-600">${shop.totalRevenue.toLocaleString()}</div>
                                                    <div className="text-xs text-gray-600">Revenue impact</div>
                                                    <div className="text-xs text-blue-600">Net: ${(shop.totalRevenue - shop.totalCommissionsPaid).toLocaleString()}</div>
                                                    <div className={`text-xs ${shop.totalRevenue > shop.totalCommissionsPaid ? 'text-green-600' : 'text-orange-600'}`}>
                                                        {shop.totalRevenue > shop.totalCommissionsPaid ? '✅ Profitable' : '📈 Building'}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Complete Affiliate Insights */}
                    <div className="bg-white rounded-xl shadow-lg border overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b">
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">📈 Complete Affiliate Insights</h2>
                            <p className="text-gray-600">Comprehensive analysis of affiliate performance and customer acquisition</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-xs text-gray-700 uppercase">
                                    <tr>
                                        <th className="px-6 py-3 text-left">Affiliate Details</th>
                                        <th className="px-6 py-3 text-left">Promotion Activity</th>
                                        <th className="px-6 py-3 text-left">Customer Quality</th>
                                        <th className="px-6 py-3 text-left">Network Reach</th>
                                        <th className="px-6 py-3 text-left">Earnings & Performance</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {intelligenceData.affiliateInsights?.slice(0, 10).map((affiliate: any) => (
                                        <tr key={affiliate.affiliateId} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="font-medium text-gray-900">{affiliate.affiliateName}</div>
                                                    <div className="text-xs text-gray-500">{affiliate.affiliateEmail}</div>
                                                    <div className="text-xs text-blue-600">{affiliate.affiliateCredits.toLocaleString()} credits</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="text-sm">🎫 {affiliate.totalCouponsPromoted} coupons promoted</div>
                                                    <div className="text-sm">✅ {affiliate.totalRedemptions} conversions</div>
                                                    <div className="text-xs text-gray-600">Daily avg: {affiliate.performanceMetrics.avgRedemptionsPerDay.toFixed(1)}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="text-sm">👥 {affiliate.totalCustomers} customers acquired</div>
                                                    <div className="text-xs text-green-600">✅ {affiliate.customerQuality.verified} verified ({affiliate.customerQuality.qualityScore}%)</div>
                                                    <div className="text-xs text-blue-600">📋 {affiliate.customerQuality.completeProfiles} complete profiles</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="text-sm">🏪 {affiliate.shopsWorkedWith} shops partnered</div>
                                                    <div className="text-xs text-purple-600">Best: {affiliate.detailedShopsPerformance[0]?.shopName || 'N/A'}</div>
                                                    <div className="text-xs text-gray-600">Diversity: {affiliate.shopsWorkedWith > 3 ? 'High' : 'Medium'}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="text-sm font-medium text-green-600">💰 {affiliate.totalCommissionsEarned.toLocaleString()} earned</div>
                                                    <div className="text-xs text-gray-600">Avg: {affiliate.averageCommissionPerRedemption} per conversion</div>
                                                    <div className="text-xs text-blue-600">Status: {affiliate.performanceMetrics.networkGrowthRate}</div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Full Customer Activity */}
                    <div className="bg-white rounded-xl shadow-lg border overflow-hidden">
                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 border-b">
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">👥 Full Customer Activity</h2>
                            <p className="text-gray-600">Complete customer behavior and cross-shop activity analysis</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-xs text-gray-700 uppercase">
                                    <tr>
                                        <th className="px-6 py-3 text-left">Customer Details</th>
                                        <th className="px-6 py-3 text-left">Activity Summary</th>
                                        <th className="px-6 py-3 text-left">Network Engagement</th>
                                        <th className="px-6 py-3 text-left">Value & Behavior</th>
                                        <th className="px-6 py-3 text-left">Last Activity</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {intelligenceData.customerActivity?.slice(0, 15).map((customer: any) => (
                                        <tr key={customer.customerId} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="font-medium text-gray-900">{customer.customerName || 'Anonymous'}</div>
                                                    <div className="text-xs text-gray-500">{customer.customerEmail || 'No email'}</div>
                                                    <div className="text-xs text-blue-600">{customer.customerPhone || 'No phone'}</div>
                                                    <div className={`text-xs ${customer.isVerified ? 'text-green-600' : 'text-orange-600'}`}>
                                                        {customer.isVerified ? '✅ Verified' : '⏳ Unverified'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="text-sm">🎫 {customer.totalRedemptions} redemptions</div>
                                                    <div className="text-xs text-blue-600">💰 ${customer.totalSavings.toLocaleString()} saved</div>
                                                    <div className="text-xs text-gray-600">Source: {customer.acquisitionSource}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="text-sm">🏪 {customer.shopsVisited} shops visited</div>
                                                    <div className="text-xs text-purple-600">🤝 {customer.affiliatesUsed} affiliates used</div>
                                                    <div className="text-xs text-gray-600">Cross-shop: {customer.shopsVisited > 1 ? 'Active' : 'Single shop'}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="text-sm">Avg: ${(customer.totalSavings / customer.totalRedemptions).toFixed(2)} per visit</div>
                                                    <div className="text-xs text-green-600">Value: {customer.totalSavings > 100 ? 'High' : customer.totalSavings > 50 ? 'Medium' : 'New'}</div>
                                                    <div className={`text-xs ${customer.hasCompleteProfile ? 'text-green-600' : 'text-orange-600'}`}>
                                                        Profile: {customer.hasCompleteProfile ? 'Complete' : 'Incomplete'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="text-sm">{new Date(customer.lastActivity).toLocaleDateString()}</div>
                                                    <div className="text-xs text-gray-500">{new Date(customer.lastActivity).toLocaleTimeString()}</div>
                                                    <div className="text-xs text-blue-600">
                                                        {Math.floor((Date.now() - customer.lastActivity) / (1000 * 60 * 60 * 24))} days ago
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Global Performance Metrics */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white rounded-xl shadow-lg border p-6">
                            <h3 className="text-xl font-bold text-gray-800 mb-4">📊 Daily/Weekly/Monthly Performance</h3>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="text-center p-4 bg-blue-50 rounded-lg">
                                    <div className="text-2xl font-bold text-blue-600">{intelligenceData.globalAnalytics.dailyWeeklyMonthlyMetrics?.daily.redemptions || 0}</div>
                                    <div className="text-sm text-blue-800">Today</div>
                                </div>
                                <div className="text-center p-4 bg-green-50 rounded-lg">
                                    <div className="text-2xl font-bold text-green-600">{intelligenceData.globalAnalytics.dailyWeeklyMonthlyMetrics?.weekly.redemptions || 0}</div>
                                    <div className="text-sm text-green-800">This Week</div>
                                </div>
                                <div className="text-center p-4 bg-purple-50 rounded-lg">
                                    <div className="text-2xl font-bold text-purple-600">{intelligenceData.globalAnalytics.dailyWeeklyMonthlyMetrics?.monthly.redemptions || 0}</div>
                                    <div className="text-sm text-purple-800">This Month</div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-xl shadow-lg border p-6">
                            <h3 className="text-xl font-bold text-gray-800 mb-4">💰 Revenue/Payout Tracking</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Total Discounts Given:</span>
                                    <span className="font-semibold text-red-600">${intelligenceData.globalAnalytics.revenuePayoutTracking?.totalDiscountsGiven.toLocaleString() || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Total Commissions Paid:</span>
                                    <span className="font-semibold text-orange-600">${intelligenceData.globalAnalytics.revenuePayoutTracking?.totalCommissionsPaid.toLocaleString() || 0}</span>
                                </div>
                                <div className="flex justify-between border-t pt-2">
                                    <span className="text-gray-600">Net Platform Impact:</span>
                                    <span className="font-semibold text-green-600">${intelligenceData.globalAnalytics.revenuePayoutTracking?.netPlatformImpact.toLocaleString() || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {!busy && !intelligenceData.globalAnalytics && (
                <div className="bg-white rounded-xl shadow-lg border p-12 text-center">
                    <div className="text-gray-400 text-6xl mb-4">📊</div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">No Intelligence Data Available</h3>
                    <p className="text-gray-600 mb-4">Click "Refresh Data" to load comprehensive analytics</p>
                    <button
                        onClick={fetchIntelligenceData}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all font-medium"
                    >
                        🔄 Load Intelligence Data
                    </button>
                </div>
            )}
        </div>
    );

    const settingsContent = (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-semibold text-dark-gray mb-4">System Settings</h3>
            <p className="text-gray-600">Administrative settings and system configuration will be available here.</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pb-12">
            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-dark-gray mb-2">Admin Dashboard</h1>
                    <p className="text-gray-600">System overview and management tools</p>
                </div>

                <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={tabButtonClass(tab.id)}
                        >
                            <span className="flex items-center gap-2">
                                {tab.icon}
                                {tab.label}
                            </span>
                        </button>
                    ))}
                </div>

                <div className="space-y-6">
                    {activeTab === 'overview' && overviewContent}
                    {activeTab === 'shops' && <div className="bg-white p-6 rounded-xl">Shop management coming soon...</div>}
                    {activeTab === 'affiliates' && <div className="bg-white p-6 rounded-xl">Affiliate management coming soon...</div>}
                    {activeTab === 'coupons' && <div className="bg-white p-6 rounded-xl">Coupon management coming soon...</div>}
                    {activeTab === 'redemptions' && <div className="bg-white p-6 rounded-xl">Redemption tracking coming soon...</div>}
                    {activeTab === 'referrals' && <div className="bg-white p-6 rounded-xl">Referral management coming soon...</div>}
                    {activeTab === 'intelligence' && intelligenceContent}
                    {activeTab === 'settings' && settingsContent}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;