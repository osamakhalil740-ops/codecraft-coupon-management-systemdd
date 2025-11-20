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

    // Intelligence calculation function
    const calculateIntelligenceInsights = (customers: any[], users: any[], coupons: any[], redemptions: any[]) => {
        const shopOwners = users.filter(u => u.roles.includes('shop-owner'));
        const affiliates = users.filter(u => u.roles.includes('affiliate'));
        
        // Simple calculations for now
        const globalAnalytics = {
            totalRevenue: redemptions.reduce((sum, r) => sum + (r.discountValue || 0), 0),
            totalCommissions: redemptions.reduce((sum, r) => sum + (r.commissionEarned || 0), 0),
            networkEfficiency: redemptions.length > 0 ? ((redemptions.filter(r => r.affiliateId).length / redemptions.length) * 100).toFixed(2) : '0',
            systemHealth: {
                healthScore: Math.min(100, ((customers.length / Math.max(1, redemptions.length)) * 100)).toFixed(1)
            }
        };

        const customerAnalytics = {
            totalUniqueCustomers: [...new Set(customers.map(c => c.userId))].length,
            verifiedCustomers: customers.filter(c => c.isVerifiedCustomer).length,
            completeProfiles: customers.filter(c => c.hasCompleteProfile).length
        };

        return {
            globalAnalytics,
            customerAnalytics,
            lastUpdated: new Date().toISOString()
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

    // Overview content
    const overviewContent = (
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
    );

    // Data Intelligence Center Content
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
                                    <p className="text-3xl font-bold">{intelligenceData.customerAnalytics.totalUniqueCustomers.toLocaleString()}</p>
                                </div>
                                <div className="text-orange-200">👥</div>
                            </div>
                        </div>
                    </div>

                    {/* Analytics Overview */}
                    <div className="bg-white rounded-xl shadow-lg border p-8">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">📊 System Analytics Overview</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-blue-50 p-6 rounded-lg">
                                <div className="text-2xl font-bold text-blue-600 mb-2">{allUsers.filter(u => u.roles.includes('shop-owner')).length}</div>
                                <div className="text-blue-800 font-medium">Total Shop Owners</div>
                                <div className="text-sm text-blue-600 mt-2">Active businesses in network</div>
                            </div>
                            <div className="bg-green-50 p-6 rounded-lg">
                                <div className="text-2xl font-bold text-green-600 mb-2">{allUsers.filter(u => u.roles.includes('affiliate')).length}</div>
                                <div className="text-green-800 font-medium">Total Affiliates</div>
                                <div className="text-sm text-green-600 mt-2">Marketing partners</div>
                            </div>
                            <div className="bg-purple-50 p-6 rounded-lg">
                                <div className="text-2xl font-bold text-purple-600 mb-2">{intelligenceData.customerAnalytics.verifiedCustomers}</div>
                                <div className="text-purple-800 font-medium">Verified Customers</div>
                                <div className="text-sm text-purple-600 mt-2">Quality customer base</div>
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