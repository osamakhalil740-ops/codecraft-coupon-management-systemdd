
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../services/api';
import { Shop, AdminCreditLog, Coupon, Redemption, Referral, Role } from '../types';
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

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const shopOwners = useMemo(() => allUsers.filter((u) => u.roles.includes('shop-owner')), [allUsers]);
    const affiliates = useMemo(() => allUsers.filter((u) => u.roles.includes('affiliate')), [allUsers]);

    const handleDeleteUser = async (userId: string) => {
        if (window.confirm(t('common.areYouSure') + ' ' + t('common.actionCannotBeUndone'))) {
            await api.deleteUser(userId);
            fetchData();
        }
    };

    const handleDeleteCoupon = async (couponId: string) => {
        if (window.confirm(t('common.areYouSure'))) {
            await api.deleteCoupon(couponId);
            fetchData();
        }
    };

    const openUserDrawer = (userToEdit: Shop) => {
        setSelectedUser(userToEdit);
        setCreditsInput(String(userToEdit.credits ?? 0));
        setRolesInput(userToEdit.roles);
        setDrawerOpen(true);
    };

    const viewAffiliateDetails = (affiliateId: string) => {
        const affiliate = affiliates.find(a => a.id === affiliateId);
        if (affiliate) {
            setSelectedAffiliate(affiliate);
            setAffiliateDetailsOpen(true);
        }
    };

    const handleRoleToggle = (role: Role) => {
        setRolesInput((prev) =>
            prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
        );
    };

    const handleSaveUserDetails = async () => {
        if (!selectedUser) return;
        setSavingUser(true);
        try {
            const creditsNumber = Number(creditsInput);
            if (!Number.isFinite(creditsNumber) || creditsNumber < 0) {
                alert("Credits must be a valid positive number");
                return;
            }
            // Admin can assign any amount of credits (no limit)
            await Promise.all([
                api.updateUserCredits(selectedUser.id, creditsNumber),
                api.updateUserRoles(selectedUser.id, rolesInput)
            ]);
            
            // Log admin credit grant if credits increased
            if (creditsNumber > selectedUser.credits) {
                await api.logAdminCreditGrant(selectedUser.id, selectedUser.name, creditsNumber - selectedUser.credits, user?.email || 'admin');
            }
            
            setDrawerOpen(false);
            setSelectedUser(null);
            fetchData();
        } finally {
            setSavingUser(false);
        }
    };

    if (!user) return null;

    const totalCreditsDistributed = creditLogs.reduce((sum, log) => sum + log.amount, 0);
    const totalRedemptions = redemptions.length;

    const tabButtonClass = (tab: AdminTab) =>
        `px-4 py-2 rounded-full text-sm font-semibold transition ${activeTab === tab ? 'bg-primary text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-slate-100'}`;

    const roles: Role[] = ['admin', 'shop-owner', 'affiliate', 'user'];

    const renderUserDrawer = () => {
        if (!drawerOpen || !selectedUser) return null;
        return (
            <div className="fixed inset-0 bg-black/40 z-50 flex justify-end" onClick={() => setDrawerOpen(false)}>
                <div
                    className="w-full max-w-md bg-white h-full shadow-2xl p-6 overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs uppercase tracking-wide text-gray-400">{selectedUser.id}</p>
                            <h2 className="text-2xl font-bold text-dark-gray mt-1">{selectedUser.name}</h2>
                            <p className="text-sm text-gray-500">{selectedUser.email}</p>
                        </div>
                        <button
                            className="text-sm text-gray-500 hover:text-alert"
                            onClick={() => setDrawerOpen(false)}
                        >
                            Close
                        </button>
                    </div>

                    <div className="mt-6 space-y-4">
                        <div>
                            <label className="text-sm font-semibold text-gray-700">Credits</label>
                            <input
                                type="number"
                                min="0"
                                value={creditsInput}
                                onChange={(e) => setCreditsInput(e.target.value)}
                                className="mt-1 w-full form-input"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                ✨ Admin privilege: You can assign any amount of credits without limits
                            </p>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-700 mb-2">Roles</p>
                            <div className="grid grid-cols-2 gap-2">
                                {roles.map((role) => (
                                    <label key={role} className="flex items-center gap-2 text-sm">
                                        <input
                                            type="checkbox"
                                            checked={rolesInput.includes(role)}
                                            onChange={() => handleRoleToggle(role)}
                                        />
                                        {t(`roles.${role}`)}
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={handleSaveUserDetails}
                                disabled={savingUser}
                                className="flex-1 btn-primary text-center"
                            >
                                {savingUser ? t('loginPage.processing') : t('profilePage.updateButton')}
                            </button>
                            <button
                                onClick={() => handleDeleteUser(selectedUser.id)}
                                className="btn-secondary dark text-alert border-alert/40"
                            >
                                {t('common.delete')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderTable = (
        title: string,
        headers: string[],
        rows: React.ReactNode,
        actions?: React.ReactNode
    ) => (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-dark-gray">{title}</h3>
                {actions}
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-600">
                    <thead className="text-xs uppercase bg-slate-50 text-gray-500">
                        <tr>
                            {headers.map((header) => (
                                <th key={header} className="px-4 py-3 whitespace-nowrap">
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">{rows}</tbody>
                </table>
            </div>
            {React.Children.count(rows) === 0 && (
                <p className="text-center text-gray-400 py-6 text-sm">No data available.</p>
            )}
        </div>
    );

    const tabs: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
        { id: 'overview', label: 'Overview', icon: <TableCellsIcon className="h-4 w-4" /> },
        { id: 'shops', label: 'Shop Owners', icon: <UserGroupIcon className="h-4 w-4" /> },
        { id: 'affiliates', label: 'Affiliates', icon: <AdjustmentsHorizontalIcon className="h-4 w-4" /> },
        { id: 'coupons', label: 'Coupons', icon: <TicketIcon className="h-4 w-4" /> },
        { id: 'redemptions', label: 'Redemptions', icon: <BanknotesIcon className="h-4 w-4" /> },
        { id: 'referrals', label: 'Referrals', icon: <GiftIcon className="h-4 w-4" /> },
        { id: 'settings', label: 'System Settings', icon: <Cog6ToothIcon className="h-4 w-4" /> }
    ];

    const overviewContent = (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title={t('admin.stats.totalUsers')}
                    value={allUsers.length}
                    icon={<UserGroupIcon className="h-6 w-6" />}
                    color="blue"
                />
                <StatCard
                    title={t('admin.stats.totalCoupons')}
                    value={allCoupons.length}
                    icon={<TicketIcon className="h-6 w-6" />}
                    color="indigo"
                />
                <StatCard
                    title={t('admin.stats.creditsDistributed')}
                    value={totalCreditsDistributed.toLocaleString()}
                    icon={<BanknotesIcon className="h-6 w-6" />}
                    color="green"
                />
                <StatCard
                    title="Total Redemptions"
                    value={totalRedemptions}
                    icon={<GiftIcon className="h-6 w-6" />}
                    color="yellow"
                />
            </div>

            {renderTable(
                t('admin.tables.creditLog.title'),
                [t('admin.tables.creditLog.date'), t('admin.tables.creditLog.shopName'), t('admin.tables.creditLog.type'), t('admin.tables.creditLog.amount')],
                creditLogs.slice(0, 10).map((item) => (
                    <tr key={item.id} className="bg-white">
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                            {item.timestamp ? new Date(item.timestamp).toLocaleString() : '---'}
                        </td>
                        <td className="px-4 py-3 font-medium text-dark-gray">{item.shopName}</td>
                        <td className="px-4 py-3">
                            <span
                                className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                    item.type === 'Referrer Bonus'
                                        ? 'bg-green-100 text-success'
                                        : item.type === 'Referred Signup'
                                            ? 'bg-blue-100 text-primary'
                                            : item.type === 'Affiliate Commission'
                                                ? 'bg-indigo-100 text-indigo-600'
                                                : 'bg-gray-100'
                                }`}
                            >
                                {t(`creditLogTypes.${item.type.replace(/\s/g, '')}`)}
                            </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-success">+{item.amount.toLocaleString()}</td>
                    </tr>
                )),
                <button className="text-sm text-primary flex items-center gap-2" onClick={() => setActiveTab('redemptions')}>
                    View more <EyeIcon className="h-4 w-4" />
                </button>
            )}
        </>
    );

    const shopsContent = renderTable(
        'Shop Owners',
        ['Name', 'Email', 'City', 'Credits', 'Roles', 'Actions'],
        shopOwners.map((item) => (
            <tr key={item.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-dark-gray">{item.name}</td>
                <td className="px-4 py-3">{item.email}</td>
                <td className="px-4 py-3">{item.city || '--'}</td>
                <td className="px-4 py-3 font-semibold">{item.credits.toLocaleString()}</td>
                <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                        {item.roles.map((role) => (
                            <span key={role} className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-700">
                                    {t(`roles.${role}`)}
                                </span>
                            ))}
                        </div>
                    </td>
                <td className="px-4 py-3 flex gap-2">
                    <button
                        onClick={() => openUserDrawer(item)}
                        className="text-primary text-sm font-semibold hover:underline"
                    >
                        Manage
                    </button>
                    <button
                        onClick={() => handleDeleteUser(item.id)}
                        className="text-alert hover:text-red-700"
                        title="Remove user"
                    >
                        <TrashIcon className="h-5 w-5" />
                    </button>
                </td>
            </tr>
        ))
    );

    // Enhanced affiliate analytics
    const getAffiliateAnalytics = (affiliateId: string) => {
        const affiliateRedemptions = redemptions.filter(r => r.affiliateId === affiliateId);
        const affiliateCoupons = coupons.filter(c => c.affiliateId === affiliateId);
        const totalCommissions = affiliateRedemptions.reduce((sum, r) => sum + (r.commissionEarned || 0), 0);
        const totalTraffic = affiliateRedemptions.length + (affiliateCoupons.length * 10); // Estimated traffic
        const conversionRate = affiliateRedemptions.length > 0 ? (affiliateRedemptions.length / totalTraffic * 100).toFixed(2) : '0.00';
        
        return {
            redemptions: affiliateRedemptions.length,
            couponsPromoted: new Set(affiliateRedemptions.map(r => r.couponId)).size,
            totalCommissions,
            conversionRate,
            totalTraffic,
            avgCommissionPerRedemption: affiliateRedemptions.length > 0 ? (totalCommissions / affiliateRedemptions.length).toFixed(2) : '0.00'
        };
    };

    const affiliatesContent = renderTable(
        'Affiliates - Complete Performance Overview',
        ['Affiliate', 'Contact', 'Performance Metrics', 'Traffic & Conversions', 'Commission Data', 'Actions'],
        affiliates.map((item) => {
            const analytics = getAffiliateAnalytics(item.id);
            
            return (
                <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                        <div className="flex flex-col">
                            <span className="font-medium text-dark-gray">{item.name}</span>
                            <span className="text-xs text-gray-500">ID: {item.id.slice(0, 8)}</span>
                            <span className="text-xs font-medium text-blue-600">{item.credits.toLocaleString()} credits</span>
                        </div>
                    </td>
                    <td className="px-4 py-3">
                        <div className="text-sm">
                            <div>{item.email}</div>
                            <div className="text-xs text-gray-500">Joined: {new Date(item.createdAt || Date.now()).toLocaleDateString()}</div>
                        </div>
                    </td>
                    <td className="px-4 py-3">
                        <div className="space-y-1 text-sm">
                            <div><span className="font-medium text-blue-600">{analytics.couponsPromoted}</span> coupons promoted</div>
                            <div><span className="font-medium text-green-600">{analytics.redemptions}</span> conversions</div>
                            <div><span className="font-medium text-orange-600">{analytics.conversionRate}%</span> conv. rate</div>
                        </div>
                    </td>
                    <td className="px-4 py-3">
                        <div className="space-y-1 text-sm">
                            <div>Traffic: <span className="font-medium">{analytics.totalTraffic}</span></div>
                            <div>Clicks: <span className="text-purple-600 font-medium">~{analytics.totalTraffic}</span></div>
                            <div>Redemptions: <span className="text-green-600 font-medium">{analytics.redemptions}</span></div>
                        </div>
                    </td>
                    <td className="px-4 py-3">
                        <div className="space-y-1 text-sm">
                            <div className="font-semibold text-purple-600">{analytics.totalCommissions.toLocaleString()} total</div>
                            <div>Avg: {analytics.avgCommissionPerRedemption}</div>
                            <div className="text-xs text-gray-500">per conversion</div>
                        </div>
                    </td>
                    <td className="px-4 py-3">
                        <div className="space-y-2">
                            <button
                                onClick={() => openUserDrawer(item)}
                                className="block w-full text-xs bg-primary text-white px-2 py-1 rounded hover:opacity-90"
                            >
                                Manage
                            </button>
                            <button
                                onClick={() => viewAffiliateDetails(item.id)}
                                className="block w-full text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200"
                            >
                                Full Report
                            </button>
                        </div>
                    </td>
                </tr>
            );
        })
    );

    const couponsContent = renderTable(
        t('admin.tables.allCoupons.title'),
        ['Title', 'Shop Owner', 'Uses Left', 'Commission', 'Actions'],
        allCoupons.map((coupon) => (
            <tr key={coupon.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">{coupon.title}</td>
                <td className="px-4 py-3">{coupon.shopOwnerName}</td>
                <td className="px-4 py-3">{coupon.usesLeft} / {coupon.maxUses}</td>
                <td className="px-4 py-3">{coupon.affiliateCommission}</td>
                <td className="px-4 py-3">
                    <button onClick={() => handleDeleteCoupon(coupon.id)} className="text-alert hover:text-red-700">
                        <TrashIcon className="h-5 w-5" />
                        </button>
                    </td>
                </tr>
        ))
    );

    const redemptionsContent = renderTable(
        'Redemptions',
        ['Date', 'Coupon', 'Shop Owner', 'Affiliate', 'Commission'],
        redemptions.map((record) => (
            <tr key={record.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-xs text-gray-500">
                    {record.redeemedAt ? new Date(record.redeemedAt).toLocaleString() : '--'}
                </td>
                <td className="px-4 py-3 font-medium text-dark-gray">{record.couponTitle}</td>
                <td className="px-4 py-3">{record.shopOwnerId}</td>
                <td className="px-4 py-3">{record.affiliateId || 'N/A'}</td>
                <td className="px-4 py-3">{record.commissionEarned ? `+${record.commissionEarned}` : '--'}</td>
            </tr>
        ))
    );

    const referralsContent = renderTable(
        'Referrals',
        ['Referrer', 'Referred Shop', 'Status', 'Signup Date'],
        referrals.map((referral) => (
            <tr key={referral.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">{referral.referrerId}</td>
                <td className="px-4 py-3 font-medium text-dark-gray">{referral.referredShopName}</td>
                <td className="px-4 py-3">
                    <span
                        className={`px-2 py-1 text-xs rounded-full ${
                            referral.status === 'rewarded' ? 'bg-green-100 text-success' : 'bg-yellow-100 text-pending'
                        }`}
                    >
                        {t(`referralStatus.${referral.status}`)}
                    </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">
                    {referral.signupDate ? new Date(referral.signupDate).toLocaleString() : '--'}
                </td>
            </tr>
        ))
    );

    const settingsContent = (
        <div className="space-y-6">
            {/* System Activity Feed */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
                <h3 className="text-lg font-semibold text-dark-gray mb-4">🔍 Real-Time System Activity</h3>
                <p className="text-sm text-gray-500 mb-4">Monitor all account actions and system events</p>
                
                <div className="max-h-96 overflow-y-auto space-y-3">
                    {systemActivity.slice(0, 20).map((activity, index) => (
                        <div key={activity.id || index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                            <div className={`w-2 h-2 rounded-full mt-2 ${
                                activity.type === 'CUSTOMER_REDEMPTION' ? 'bg-green-500' :
                                activity.type === 'Admin Grant' ? 'bg-blue-500' :
                                activity.source === 'adminNotifications' ? 'bg-orange-500' :
                                'bg-gray-500'
                            }`} />
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-800">
                                        {activity.title || activity.type || 'System Action'}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        {activity.timestamp ? 
                                            new Date(activity.timestamp.toDate ? activity.timestamp.toDate() : activity.timestamp).toLocaleString() : 
                                            'Just now'
                                        }
                                    </span>
                                </div>
                                <p className="text-xs text-gray-600 mt-1">
                                    {activity.message || activity.details || `Action from ${activity.source}`}
                                </p>
                                {activity.customerData && (
                                    <div className="text-xs text-blue-600 mt-1">
                                        👤 {activity.customerData.name} | 📞 {activity.customerData.phone}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    
                    {systemActivity.length === 0 && (
                        <p className="text-center text-gray-400 py-8">No recent activity</p>
                    )}
                </div>
            </div>

            {/* System Settings */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
                <h3 className="text-lg font-semibold text-dark-gray mb-4">⚙️ System Settings</h3>
                <p className="text-sm text-gray-500 mb-6">
                    Core automations (affiliate & referral payouts) are currently running via client-side logic.
                    Upgrade Firebase to Blaze plan to unlock secure Cloud Functions for production-grade automation.
                </p>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                    <li>Visit Firebase Console &gt; Billing → upgrade to Blaze.</li>
                    <li>Deploy backend functions: <code>firebase deploy --only functions</code>.</li>
                    <li>Revisit this panel to manage live payouts and advanced automation.</li>
                </ol>
            </div>
        </div>
    );

    const tabContentMap: Record<AdminTab, React.ReactNode> = {
        overview: overviewContent,
        shops: shopsContent,
        affiliates: affiliatesContent,
        coupons: couponsContent,
        redemptions: redemptionsContent,
        referrals: referralsContent,
        settings: settingsContent
    };

    return (
        <div className="space-y-8 animate-fadeIn">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="text-sm uppercase tracking-wide text-gray-400">Control Center</p>
                    <h1 className="text-3xl font-bold text-dark-gray">{t('admin.dashboardTitle')}</h1>
                </div>
                <button
                    onClick={fetchData}
                    className="btn-secondary dark flex items-center gap-2 text-sm"
                    disabled={busy}
                >
                    <ArrowPathIcon className={`h-4 w-4 ${busy ? 'animate-spin' : ''}`} />
                    Refresh data
                </button>
            </div>

            <div className="flex flex-wrap gap-3">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        className={tabButtonClass(tab.id)}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        <span className="inline-flex items-center gap-2">
                            {tab.icon}
                            {tab.label}
                        </span>
                    </button>
            ))}
            </div>

            <div className="space-y-8">{tabContentMap[activeTab]}</div>

            {renderUserDrawer()}
        </div>
    );
};

export default AdminDashboard;