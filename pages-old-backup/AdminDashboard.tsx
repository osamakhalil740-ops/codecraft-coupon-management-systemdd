import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { Shop, AdminCreditLog, Coupon, Redemption, Referral, Role } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useRealTimeTracking } from '../hooks/useRealTimeTracking';
import StatCard from '../components/StatCard';
import RealTimeActivityFeed from '../components/RealTimeActivityFeed';
import {
    UserGroupIcon,
    BanknotesIcon,
    GiftIcon,
    TicketIcon,
    EyeIcon,
    Cog6ToothIcon,
    AdjustmentsHorizontalIcon,
    TableCellsIcon,
    SignalIcon,
    UserCircleIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from '../hooks/useTranslation';
import Breadcrumb from '../components/Breadcrumb';
import SimpleChart from '../components/SimpleChart';
import EmptyState from '../components/EmptyState';
import EnhancedSearch from '../components/EnhancedSearch';
import Tooltip, { HelpTooltip } from '../components/Tooltip';
import { AdminUserManagement } from '../components/AdminUserManagement';
import { logger } from '../utils/logger';

type AdminTab = 'overview' | 'users' | 'shops' | 'affiliates' | 'coupons' | 'redemptions' | 'referrals' | 'intelligence' | 'settings';

const AdminDashboard: React.FC = () => {
    const { user } = useAuth();
    const { t } = useTranslation();
    const { trackingData, trackUserAction } = useRealTimeTracking(user?.roles || [], user?.id);
    
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
    const [busy, setBusy] = useState(false);
    const [affiliateDetailsOpen, setAffiliateDetailsOpen] = useState(false);
    const [selectedAffiliate, setSelectedAffiliate] = useState<Shop | null>(null);
    const [systemActivity, setSystemActivity] = useState<any[]>([]);
    const [allCustomerData, setAllCustomerData] = useState<any[]>([]);
    const [intelligenceData, setIntelligenceData] = useState<any>({});

    const trackAdminAction = useCallback((action: string, details?: any) => {
        if (user?.id) {
            trackUserAction({
                userId: user.id,
                userName: user.name || 'Admin',
                action,
                details,
                page: `/admin/${activeTab}`
            });
        }
    }, [user, activeTab, trackUserAction]);

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
        if (user?.roles.includes('admin') || user?.roles.includes('super-admin')) {
            setBusy(true);
            try {
                logger.debug('🔍 ADMIN: Fetching intelligence data...');
                const intelligenceResult = await api.getFullIntelligenceData();
                setIntelligenceData(intelligenceResult);
                logger.debug('✅ ADMIN: Intelligence data loaded successfully');
            } catch (error) {
                logger.error('❌ ADMIN: Error loading intelligence data:', error);
                setIntelligenceData({
                    error: 'Failed to load intelligence data. Retrying...',
                    lastUpdated: new Date().toISOString()
                });
            } finally {
                setBusy(false);
            }
        }
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (activeTab === 'intelligence') {
            fetchIntelligenceData();
        }
        trackAdminAction('tab_change', { tab: activeTab });
    }, [activeTab, trackAdminAction, fetchIntelligenceData]);

    // Auto-refresh for intelligence tab - More user-friendly timing
    useEffect(() => {
        let intervalId: NodeJS.Timeout;
        if (activeTab === 'intelligence') {
            // Longer interval - 5 minutes for optimal user experience
            intervalId = setInterval(() => {
                logger.debug('🔄 Auto-refreshing intelligence data (5-minute interval)...');
                fetchIntelligenceData();
            }, 300000); // 5 minutes for comfortable reading
        }
        return () => {
            if (intervalId) {
                clearInterval(intervalId);
                logger.debug('🔴 Intelligence auto-refresh stopped');
            }
        };
    }, [activeTab, fetchIntelligenceData]);

    if (!user) return null;

    const tabs = [
        { id: 'overview' as AdminTab, label: 'Overview', icon: <TableCellsIcon className="h-4 w-4" /> },
        { id: 'users' as AdminTab, label: 'User Management', icon: <UserCircleIcon className="h-4 w-4" /> },
        { id: 'shops' as AdminTab, label: 'Shop Owners', icon: <UserGroupIcon className="h-4 w-4" /> },
        { id: 'affiliates' as AdminTab, label: 'Affiliates', icon: <AdjustmentsHorizontalIcon className="h-4 w-4" /> },
        { id: 'coupons' as AdminTab, label: 'Coupons', icon: <TicketIcon className="h-4 w-4" /> },
        { id: 'redemptions' as AdminTab, label: 'Redemptions', icon: <BanknotesIcon className="h-4 w-4" /> },
        { id: 'referrals' as AdminTab, label: 'Referrals', icon: <GiftIcon className="h-4 w-4" /> },
        { id: 'intelligence' as AdminTab, label: 'Data Intelligence Center', icon: <TableCellsIcon className="h-4 w-4" /> },
        { id: 'settings' as AdminTab, label: 'System Settings', icon: <Cog6ToothIcon className="h-4 w-4" /> }
    ];

    const tabButtonClass = (tabId: AdminTab) => {
        const isActive = activeTab === tabId;
        return `px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${
            isActive ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
        }`;
    };

    // Intelligence Content
    const intelligenceContent = (
        <div className="space-y-8">
            <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white p-8 rounded-xl shadow-lg">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-4xl font-bold mb-2">🧠 Data Intelligence Center</h1>
                        <p className="text-purple-100">Comprehensive system-wide analytics and insights dashboard</p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2 bg-green-100 bg-opacity-20 px-3 py-2 rounded-lg">
                            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                            <span className="text-sm font-medium text-green-100">Live Updates Active</span>
                        </div>
                        <button
                            onClick={fetchIntelligenceData}
                            disabled={busy}
                            className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all"
                        >
                            {busy ? '🔄 Loading...' : '🔄 Refresh Now'}
                        </button>
                    </div>
                </div>
                <p className="text-sm text-blue-200">
                    Last updated: {intelligenceData.lastUpdated ? new Date(intelligenceData.lastUpdated).toLocaleString() : 'Loading...'}
                </p>
            </div>

            {busy && (
                <div className="text-center py-12">
                    <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
                    <p className="mt-4 text-gray-600">Loading comprehensive intelligence data...</p>
                </div>
            )}

            {intelligenceData.error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                    <div className="text-red-600 text-lg font-medium mb-2">⚠️ Data Loading Error</div>
                    <p className="text-red-700 mb-4">{intelligenceData.error}</p>
                    <button
                        onClick={fetchIntelligenceData}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
                    >
                        🔄 Retry Loading
                    </button>
                </div>
            )}

            {(!busy && intelligenceData.dataLoaded && !intelligenceData.error) && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-blue-100 text-sm">System Health</p>
                                    <p className="text-3xl font-bold">{intelligenceData.globalAnalytics?.systemHealth?.healthScore || '0'}%</p>
                                </div>
                                <div className="text-blue-200">💚</div>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-green-100 text-sm">Network Efficiency</p>
                                    <p className="text-3xl font-bold">{intelligenceData.globalAnalytics?.networkEfficiency || '0'}%</p>
                                </div>
                                <div className="text-green-200">📈</div>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-purple-100 text-sm">Total Revenue</p>
                                    <p className="text-3xl font-bold">${(intelligenceData.globalAnalytics?.totalRevenue || 0).toLocaleString()}</p>
                                </div>
                                <div className="text-purple-200">💰</div>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-xl">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-orange-100 text-sm">Total Customers</p>
                                    <p className="text-3xl font-bold">{(intelligenceData.globalAnalytics?.totalUniqueCustomers || 0).toLocaleString()}</p>
                                </div>
                                <div className="text-orange-200">👥</div>
                            </div>
                        </div>
                    </div>

                    <div className="data-section">
                        <div className="data-section-header">
                            <div className="data-section-title">🏪 Shop Insights</div>
                            <div className="data-section-subtitle">Comprehensive analysis of all shop owner performance and customer acquisition</div>
                            <div className="flex items-center gap-2">
                                <HelpTooltip content="Detailed analysis of shop owner performance including customer acquisition and revenue metrics" />
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            {intelligenceData.shopInsights && intelligenceData.shopInsights.length > 0 ? (
                                <table className="data-table">
                                    <thead className="bg-gray-50 text-xs text-gray-700 uppercase">
                                        <tr>
                                            <th className="px-6 py-3 text-left">Shop Details</th>
                                            <th className="px-6 py-3 text-left">Performance</th>
                                            <th className="px-6 py-3 text-left">Customer Analytics</th>
                                            <th className="px-6 py-3 text-left">Revenue & Growth</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {intelligenceData.shopInsights.map((shop: any, index: number) => (
                                            <tr key={shop.shopId || index} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-gray-900">{shop.shopName}</div>
                                                    <div className="text-sm text-gray-500">{shop.shopEmail}</div>
                                                    <div className="text-xs text-blue-600">{shop.shopCredits} credits</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm">
                                                        <div className="text-gray-900">{shop.totalCoupons} coupons</div>
                                                        <div className="text-gray-500">{shop.totalRedemptions} redemptions</div>
                                                        <div className="text-green-600">{shop.affiliatePartnerships} partnerships</div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm">
                                                        <div className="text-gray-900">{shop.uniqueCustomers} customers</div>
                                                        <div className="text-blue-600">
                                                            Direct: {shop.directVsAffiliate?.direct || 0} | 
                                                            Affiliate: {shop.directVsAffiliate?.affiliate || 0}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm">
                                                        <div className="text-gray-900 font-medium">${(shop.totalRevenue || 0).toFixed(2)}</div>
                                                        <div className="text-red-600">-${(shop.totalCommissionsPaid || 0).toFixed(2)} commissions</div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="p-8">
                                    <EmptyState
                                        title="No Shop Insights Available"
                                        description="Shop insights will appear here once shop owners start creating coupons and receiving redemptions. The analytics will show performance metrics, customer acquisition data, and revenue tracking."
                                        actionLabel="Refresh Data"
                                        onAction={fetchIntelligenceData}
                                        variant="default"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="data-section">
                        <div className="data-section-header">
                            <div className="data-section-title">⚡ Real-Time Activity Stream</div>
                            <div className="data-section-subtitle">Live system activity and user interactions</div>
                        </div>
                        <div className="p-6">
                            <RealTimeActivityFeed 
                                userRole={user?.roles || []}
                                userId={user?.id}
                                maxItems={15}
                                showFilters={true}
                            />
                        </div>
                    </div>
                </>
            )}

            {(!busy && !intelligenceData.dataLoaded && !intelligenceData.error) && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
                    <div className="text-gray-400 text-6xl mb-4">📊</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Intelligence Data Available</h3>
                    <p className="text-gray-600 mb-4">Data will automatically appear as users interact with the system.</p>
                    <button
                        onClick={fetchIntelligenceData}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                    >
                        🔄 Load Intelligence Data
                    </button>
                </div>
            )}
        </div>
    );

    // Overview content
    const overviewContent = (
        <div className="space-y-8">
            <div className="responsive-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <div className="dashboard-metric micro-interaction">
                    <div className="metric-value">{allUsers.length}</div>
                    <div className="metric-label">Total Users</div>
                    <div className="metric-change positive">+12% this month</div>
                </div>
                <div className="dashboard-metric micro-interaction">
                    <div className="metric-value">{allCoupons.length}</div>
                    <div className="metric-label">Total Coupons</div>
                    <div className="metric-change positive">+8% this week</div>
                </div>
                <div className="dashboard-metric micro-interaction">
                    <div className="metric-value">{redemptions.length}</div>
                    <div className="metric-label">Redemptions</div>
                    <div className="metric-change positive">+24% this week</div>
                </div>
                <div className="dashboard-metric micro-interaction">
                    <div className="metric-value">{referrals.length}</div>
                    <div className="metric-label">Referrals</div>
                    <div className="metric-change negative">-3% this week</div>
                </div>
                <div className="dashboard-metric micro-interaction">
                    <div className="metric-value">{trackingData?.totalActivities?.toString() || '0'}</div>
                    <div className="metric-label">Live Activity</div>
                    <div className="caption text-gray-500 mt-2">
                        {trackingData?.lastUpdate ? `Updated ${new Date(trackingData.lastUpdate).toLocaleTimeString()}` : 'Loading...'}
                    </div>
                </div>
            </div>

            {/* Enhanced Analytics Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SimpleChart
                    type="bar"
                    title="User Growth by Type"
                    data={[
                        { label: 'Shop Owners', value: allUsers.filter(u => u.roles && u.roles.includes('shop-owner')).length, color: 'bg-gradient-to-r from-blue-500 to-blue-600' },
                        { label: 'Affiliates', value: allUsers.filter(u => u.roles && u.roles.includes('affiliate')).length, color: 'bg-gradient-to-r from-green-500 to-green-600' },
                        { label: 'Customers', value: allUsers.filter(u => u.roles && u.roles.includes('customer')).length, color: 'bg-gradient-to-r from-purple-500 to-purple-600' },
                        { label: 'Admins', value: allUsers.filter(u => u.roles && u.roles.includes('admin')).length, color: 'bg-gradient-to-r from-orange-500 to-orange-600' }
                    ]}
                />
                <SimpleChart
                    type="donut"
                    title="Coupon Status Distribution"
                    data={[
                        { label: 'Active', value: allCoupons.filter(c => c.usesLeft > 0).length, color: '#10b981' },
                        { label: 'Expired', value: allCoupons.filter(c => c.usesLeft <= 0).length, color: '#ef4444' },
                        { label: 'Draft', value: Math.floor(allCoupons.length * 0.1), color: '#6b7280' }
                    ]}
                />
            </div>
            <div className="mt-8">
                <RealTimeActivityFeed 
                    userRole={user?.roles || []}
                    userId={user?.id}
                    maxItems={20}
                    showFilters={true}
                />
            </div>
        </div>
    );

    // If intelligence tab is active, render separately
    if (activeTab === 'intelligence') {
        return (
            <div className="p-8 max-w-7xl mx-auto">
                {intelligenceContent}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            <div className="p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="breadcrumb-container mb-6">
                        <Breadcrumb 
                            items={[
                                { label: 'Dashboard', path: '/dashboard' },
                                { label: 'Admin Panel' }
                            ]}
                        />
                    </div>

                    <div className="mb-8">
                        <h1 className="heading-lg text-gray-800 mb-2">
                            {t('admin.title', 'Admin Dashboard')}
                        </h1>
                        <p className="body-lg text-gray-600">
                            {t('admin.subtitle', 'Comprehensive platform management and analytics')}
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-8 overflow-x-auto">
                        <div className="flex p-2 gap-2" role="tablist" aria-label="Admin Dashboard Navigation">
                            {tabs.map((tab, index) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`${tabButtonClass(tab.id)} btn-enhanced`}
                                    role="tab"
                                    aria-selected={activeTab === tab.id}
                                    aria-controls={`tab-panel-${tab.id}`}
                                    tabIndex={activeTab === tab.id ? 0 : -1}
                                    onKeyDown={(e) => {
                                        if (e.key === 'ArrowRight') {
                                            e.preventDefault();
                                            const nextIndex = (index + 1) % tabs.length;
                                            setActiveTab(tabs[nextIndex].id);
                                        } else if (e.key === 'ArrowLeft') {
                                            e.preventDefault();
                                            const prevIndex = index === 0 ? tabs.length - 1 : index - 1;
                                            setActiveTab(tabs[prevIndex].id);
                                        }
                                    }}
                                >
                                    <div className="flex items-center space-x-2">
                                        {tab.icon}
                                        <span>{tab.label}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {activeTab === 'overview' && overviewContent}
                    {activeTab === 'users' && <AdminUserManagement />}
                    {activeTab === 'shops' && (
                        <div className="bg-white rounded-xl shadow-lg border overflow-hidden p-6">
                            <h2 className="text-2xl font-bold text-gray-800">Shop Owners Management</h2>
                            <p className="text-gray-600">Total Shop Owners: {allUsers.filter(u => u.roles && u.roles.includes('shop-owner')).length}</p>
                        </div>
                    )}
                    {activeTab === 'affiliates' && (
                        <div className="bg-white rounded-xl shadow-lg border overflow-hidden p-6">
                            <h2 className="text-2xl font-bold text-gray-800">Affiliates Management</h2>
                            <p className="text-gray-600">Total Affiliates: {allUsers.filter(u => u.roles && u.roles.includes('affiliate')).length}</p>
                        </div>
                    )}
                    {activeTab === 'coupons' && (
                        <div className="bg-white rounded-xl shadow-lg border overflow-hidden p-6">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                            <h2 className="text-2xl font-bold text-gray-800">Coupons Management</h2>
                                    <p className="text-gray-600 mt-1">Total Coupons: {allCoupons.length}</p>
                                </div>
                                <button
                                    onClick={fetchData}
                                    disabled={busy}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                >
                                    {busy ? 'Refreshing...' : '🔄 Refresh'}
                                </button>
                            </div>
                            
                            {allCoupons.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <p>No coupons found. Coupons will appear here once created.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50 sticky top-0">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coupon</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shop Owner</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uses</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {allCoupons.map(coupon => {
                                                    const isExpired = coupon.validityType === 'expiryDate' && coupon.expiryDate 
                                                        ? new Date(coupon.expiryDate) < new Date()
                                                        : false;
                                                    const isExhausted = coupon.usesLeft <= 0;
                                                    
                                                    return (
                                                        <tr key={coupon.id} className="hover:bg-gray-50">
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="text-sm font-medium text-gray-900">{coupon.title}</div>
                                                                <div className="text-xs text-gray-500">{coupon.description?.substring(0, 50)}...</div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                {coupon.shopOwnerName || 'Unknown'}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                {coupon.discountType === 'percentage' 
                                                                    ? `${coupon.discountValue}%` 
                                                                    : `$${coupon.discountValue}`}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                {coupon.usesLeft}/{coupon.maxUses}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                {isExpired ? (
                                                                    <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">Expired</span>
                                                                ) : isExhausted ? (
                                                                    <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">Exhausted</span>
                                                                ) : (
                                                                    <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Active</span>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                {new Date(coupon.createdAt).toLocaleDateString()}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    {activeTab === 'redemptions' && (
                        <div className="bg-white rounded-xl shadow-lg border overflow-hidden p-6">
                            <h2 className="text-2xl font-bold text-gray-800">Redemptions Management</h2>
                            <p className="text-gray-600">Total Redemptions: {redemptions.length}</p>
                        </div>
                    )}
                    {activeTab === 'referrals' && (
                        <div className="bg-white rounded-xl shadow-lg border overflow-hidden p-6">
                            <h2 className="text-2xl font-bold text-gray-800">Referrals Management</h2>
                            <p className="text-gray-600">Total Referrals: {referrals.length}</p>
                        </div>
                    )}
                    {activeTab === 'settings' && (
                        <div className="bg-white rounded-xl shadow-lg border overflow-hidden p-6">
                            <h2 className="text-2xl font-bold text-gray-800">System Settings</h2>
                            <p className="text-gray-600">Manage system-wide configurations</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;