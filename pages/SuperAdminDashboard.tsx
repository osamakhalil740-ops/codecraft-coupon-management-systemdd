import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Shop, AdminCreditLog, Coupon, Redemption, Referral, Role, CreditRequest, CreditKey } from '../types';
import { useAuth } from '../hooks/useAuth';
import StatCard from '../components/StatCard';
import {
    UserGroupIcon,
    BanknotesIcon,
    CogIcon,
    ShieldCheckIcon,
    TrashIcon,
    PencilIcon,
    PlusIcon,
    ExclamationTriangleIcon,
    CheckIcon,
    XMarkIcon,
    CreditCardIcon,
    KeyIcon
} from '@heroicons/react/24/outline';
import { db } from '../firebase';
import { doc, updateDoc, deleteDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';

type SuperAdminTab = 'overview' | 'users' | 'credits' | 'system' | 'logs';

const SuperAdminDashboard: React.FC = () => {
    const { user, isSuperAdmin } = useAuth();
    const [activeTab, setActiveTab] = useState<SuperAdminTab>('overview');
    const [allUsers, setAllUsers] = useState<Shop[]>([]);
    const [allCoupons, setAllCoupons] = useState<Coupon[]>([]);
    const [creditLogs, setCreditLogs] = useState<AdminCreditLog[]>([]);
    const [redemptions, setRedemptions] = useState<Redemption[]>([]);
    const [referrals, setReferrals] = useState<Referral[]>([]);
    const [creditRequests, setCreditRequests] = useState<CreditRequest[]>([]);
    const [creditKeys, setCreditKeys] = useState<CreditKey[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<Shop | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    // Security controls
    const [systemMaintenance, setSystemMaintenance] = useState(false);
    const [newUserRegistration, setNewUserRegistration] = useState(true);

    useEffect(() => {
        if (!isSuperAdmin) {
            return;
        }
        fetchAllData();
    }, [isSuperAdmin]);

    const fetchAllData = async () => {
        try {
            setLoading(true);
            const [users, coupons, logs, allRedemptions, allReferrals, allCreditRequests, allCreditKeys] = await Promise.all([
                api.getAllShops(),
                api.getAllCoupons(),
                api.getAdminCreditLogs(),
                api.getAllRedemptions(),
                api.getAllReferrals(),
                api.getCreditRequests(),
                api.getCreditKeys()
            ]);
            
            setAllUsers(users);
            setAllCoupons(coupons);
            setCreditLogs(logs);
            setRedemptions(allRedemptions);
            setReferrals(allReferrals);
            setCreditRequests(allCreditRequests);
            setCreditKeys(allCreditKeys);
        } catch (error) {
            console.error('Failed to fetch super admin data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Credit Request Management
    const handleGenerateKey = async (requestId: string, shopOwnerId: string, creditAmount: number, adminResponse: string) => {
        if (!user) return;
        setActionLoading(true);
        try {
            const newKey = await api.generateCreditKey(requestId, shopOwnerId, creditAmount, user.email);
            await api.updateCreditRequest(requestId, 'key_generated', adminResponse, user.email);
            
            // Show the generated key to admin
            alert(`Credit key generated successfully!\n\nKey: ${newKey.keyCode}\n\nPlease send this key to the shop owner after confirming external payment.`);
            
            await fetchAllData();
        } catch (error) {
            console.error('Failed to generate key:', error);
        } finally {
            setActionLoading(false);
        }
    };

    // User Management Functions
    const handleUpdateUserCredits = async (userId: string, newCredits: number) => {
        setActionLoading(true);
        try {
            const userRef = doc(db, 'shops', userId);
            await updateDoc(userRef, { credits: newCredits });

            // Log the credit change
            const logRef = collection(db, 'adminCreditLogs');
            await addDoc(logRef, {
                type: 'Super Admin Adjustment',
                shopId: userId,
                shopName: allUsers.find(u => u.id === userId)?.name || 'Unknown',
                amount: newCredits,
                timestamp: serverTimestamp(),
            });

            await fetchAllData();
            setEditMode(false);
        } catch (error) {
            console.error('Failed to update credits:', error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdateUserRoles = async (userId: string, newRoles: Role[]) => {
        setActionLoading(true);
        try {
            const userRef = doc(db, 'shops', userId);
            await updateDoc(userRef, { roles: newRoles });
            await fetchAllData();
        } catch (error) {
            console.error('Failed to update roles:', error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return;
        }

        setActionLoading(true);
        try {
            const userRef = doc(db, 'shops', userId);
            await deleteDoc(userRef);
            await fetchAllData();
        } catch (error) {
            console.error('Failed to delete user:', error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteCoupon = async (couponId: string) => {
        if (!window.confirm('Delete this coupon permanently?')) return;

        setActionLoading(true);
        try {
            const couponRef = doc(db, 'coupons', couponId);
            await deleteDoc(couponRef);
            await fetchAllData();
        } catch (error) {
            console.error('Failed to delete coupon:', error);
        } finally {
            setActionLoading(false);
        }
    };

    // Security check
    if (!isSuperAdmin) {
        return (
            <div className="min-h-screen bg-red-50 flex items-center justify-center">
                <div className="bg-white p-8 rounded-xl shadow-lg border border-red-200 text-center">
                    <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-red-800 mb-2">Access Denied</h1>
                    <p className="text-red-600">You don't have super admin privileges to access this page.</p>
                    <p className="text-sm text-gray-500 mt-2">Only the system administrator can access this area.</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return <div className="text-center p-10">Loading Super Admin Dashboard...</div>;
    }

    // Calculate system stats
    const totalUsers = allUsers.length;
    const totalCreditsInSystem = allUsers.reduce((sum, user) => sum + user.credits, 0);
    const totalCoupons = allCoupons.length;
    const totalRedemptions = redemptions.length;
    const shopOwners = allUsers.filter(u => u.roles.includes('shop-owner')).length;
    const marketers = allUsers.filter(u => u.roles.includes('affiliate')).length;
    const customers = allUsers.filter(u => u.roles.includes('user')).length;

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Super Admin Header */}
            <div className="bg-gradient-to-r from-red-600 via-purple-600 to-blue-600 text-white p-8 rounded-xl shadow-lg">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold">👑 Super Admin Dashboard</h1>
                        <p className="text-red-100 mt-2">Complete system control and monitoring</p>
                        <p className="text-sm text-purple-200">Logged in as: {user?.email}</p>
                    </div>
                    <div className="text-right">
                        <ShieldCheckIcon className="h-16 w-16 text-white opacity-50" />
                    </div>
                </div>
            </div>

            {/* System Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Total Users" 
                    value={totalUsers}
                    icon={<UserGroupIcon className="h-6 w-6"/>} 
                    color="blue" 
                />
                <StatCard 
                    title="System Credits" 
                    value={totalCreditsInSystem.toLocaleString()}
                    icon={<BanknotesIcon className="h-6 w-6"/>} 
                    color="green" 
                />
                <StatCard 
                    title="Total Coupons" 
                    value={totalCoupons}
                    icon={<CogIcon className="h-6 w-6"/>} 
                    color="purple" 
                />
                <StatCard 
                    title="Total Redemptions" 
                    value={totalRedemptions}
                    icon={<CheckIcon className="h-6 w-6"/>} 
                    color="yellow" 
                />
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white rounded-xl shadow-lg border">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex">
                        {[
                            { id: 'overview', label: 'System Overview', icon: CogIcon },
                            { id: 'users', label: 'User Management', icon: UserGroupIcon },
                            { id: 'credits', label: 'Credit Management', icon: BanknotesIcon },
                            { id: 'system', label: 'System Control', icon: ShieldCheckIcon },
                            { id: 'logs', label: 'Activity Logs', icon: BanknotesIcon }
                        ].map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as SuperAdminTab)}
                                    className={`flex items-center gap-2 px-6 py-4 font-medium text-sm border-b-2 ${
                                        activeTab === tab.id
                                            ? 'border-red-500 text-red-600 bg-red-50'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    <Icon className="h-5 w-5" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                <div className="p-6">
                    {/* System Overview Tab */}
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            <h3 className="text-xl font-semibold">System Overview</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <h4 className="font-semibold text-blue-800">User Breakdown</h4>
                                    <div className="mt-2 space-y-1 text-sm">
                                        <div className="flex justify-between">
                                            <span>Shop Owners:</span>
                                            <span className="font-medium">{shopOwners}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Marketers:</span>
                                            <span className="font-medium">{marketers}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Customers:</span>
                                            <span className="font-medium">{customers}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="bg-green-50 p-4 rounded-lg">
                                    <h4 className="font-semibold text-green-800">Financial Overview</h4>
                                    <div className="mt-2 space-y-1 text-sm">
                                        <div className="flex justify-between">
                                            <span>Credits in System:</span>
                                            <span className="font-medium">{totalCreditsInSystem.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Total Transactions:</span>
                                            <span className="font-medium">{creditLogs.length}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="bg-purple-50 p-4 rounded-lg">
                                    <h4 className="font-semibold text-purple-800">Platform Activity</h4>
                                    <div className="mt-2 space-y-1 text-sm">
                                        <div className="flex justify-between">
                                            <span>Active Coupons:</span>
                                            <span className="font-medium">{allCoupons.filter(c => c.usesLeft > 0).length}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Total Clicks:</span>
                                            <span className="font-medium">{allCoupons.reduce((sum, c) => sum + c.clicks, 0)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* User Management Tab */}
                    {activeTab === 'users' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-semibold">User Management</h3>
                                <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
                                    <PlusIcon className="h-5 w-5 inline mr-2" />
                                    Create Admin User
                                </button>
                            </div>
                            
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roles</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credits</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {allUsers.map((user) => (
                                            <tr key={user.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {user.email}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex gap-1">
                                                        {user.roles.map(role => (
                                                            <span key={role} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                {role}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {user.credits.toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedUser(user);
                                                            setEditMode(true);
                                                        }}
                                                        className="text-blue-600 hover:text-blue-900"
                                                    >
                                                        <PencilIcon className="h-4 w-4 inline" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteUser(user.id)}
                                                        className="text-red-600 hover:text-red-900"
                                                        disabled={actionLoading}
                                                    >
                                                        <TrashIcon className="h-4 w-4 inline" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Credit Management Tab */}
                    {activeTab === 'credits' && (
                        <div className="space-y-6">
                            <h3 className="text-xl font-semibold">Credit Request & Key Management</h3>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Credit Requests */}
                                <div className="bg-white border border-gray-200 rounded-lg p-6">
                                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                                        <CreditCardIcon className="h-5 w-5" />
                                        Credit Requests ({creditRequests.filter(r => r.status === 'pending').length} pending)
                                    </h4>
                                    
                                    <div className="space-y-4 max-h-96 overflow-y-auto">
                                        {creditRequests.map(request => (
                                            <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <h5 className="font-medium">{request.shopOwnerName}</h5>
                                                        <p className="text-sm text-gray-600">{request.shopOwnerEmail}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-lg font-bold text-green-600">
                                                            {request.requestedAmount.toLocaleString()} credits
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {new Date(request.requestedAt).toLocaleDateString()}
                                                        </div>
                                                        <div className={`text-xs px-2 py-0.5 rounded mt-1 ${
                                                            request.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                            request.status === 'key_generated' ? 'bg-blue-100 text-blue-800' :
                                                            'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                            {request.status === 'key_generated' ? 'Key Generated' : request.status}
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="mb-3">
                                                    <p className="text-sm font-medium text-gray-700 mb-1">Business Need:</p>
                                                    <p className="text-sm text-gray-600">{request.message}</p>
                                                </div>
                                                
                                                {request.adminResponse && (
                                                    <div className="mb-3">
                                                        <p className="text-sm font-medium text-gray-700 mb-1">Admin Response:</p>
                                                        <p className="text-sm text-blue-600">{request.adminResponse}</p>
                                                        <p className="text-xs text-gray-500">
                                                            Processed by {request.processedBy} on {request.processedAt && new Date(request.processedAt).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                )}
                                                
                                                {request.status === 'pending' && (
                                                    <button
                                                        onClick={() => {
                                                            const response = prompt('Enter admin response (optional):') || 'Key generated after external payment confirmation.';
                                                            if (window.confirm('Generate activation key for this request? Make sure external payment is confirmed first.')) {
                                                                handleGenerateKey(request.id, request.shopOwnerId, request.requestedAmount, response);
                                                            }
                                                        }}
                                                        disabled={actionLoading}
                                                        className="w-full bg-green-600 text-white text-sm py-2 px-4 rounded hover:bg-green-700 disabled:opacity-50"
                                                    >
                                                        Generate Activation Key
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        
                                        {creditRequests.length === 0 && (
                                            <p className="text-gray-500 text-center py-8">No credit requests yet</p>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Generated Keys */}
                                <div className="bg-white border border-gray-200 rounded-lg p-6">
                                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                                        <KeyIcon className="h-5 w-5" />
                                        Generated Keys ({creditKeys.filter(k => !k.isUsed).length} active)
                                    </h4>
                                    
                                    <div className="space-y-3 max-h-96 overflow-y-auto">
                                        {creditKeys.map(key => (
                                            <div key={key.id} className={`border rounded-lg p-3 ${key.isUsed ? 'border-gray-200 bg-gray-50' : 'border-blue-200 bg-blue-50'}`}>
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <div className="font-mono text-sm font-bold text-blue-600 mb-1">
                                                            {key.keyCode}
                                                        </div>
                                                        <div className="text-sm text-gray-700">
                                                            {allUsers.find(u => u.id === key.shopOwnerId)?.name || 'Unknown User'}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {key.creditAmount.toLocaleString()} credits
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className={`text-xs px-2 py-0.5 rounded ${key.isUsed ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                                                            {key.isUsed ? 'Used' : 'Active'}
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="text-xs text-gray-500 mt-2">
                                                    Created: {new Date(key.createdAt).toLocaleDateString()}
                                                    {key.isUsed && key.usedAt ? (
                                                        <> • Used: {new Date(key.usedAt).toLocaleDateString()}</>
                                                    ) : (
                                                        <> • Expires: {new Date(key.expiresAt).toLocaleDateString()}</>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        
                                        {creditKeys.length === 0 && (
                                            <p className="text-gray-500 text-center py-8">No keys generated yet</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h4 className="font-medium text-blue-800 mb-2">🔑 Key-Based Credit Process</h4>
                                <ol className="text-sm text-blue-700 space-y-1">
                                    <li><strong>1.</strong> Shop owner submits credit request</li>
                                    <li><strong>2.</strong> You contact them externally to discuss payment</li>
                                    <li><strong>3.</strong> Once payment is confirmed, click "Generate Activation Key"</li>
                                    <li><strong>4.</strong> Send the generated key to shop owner via external communication</li>
                                    <li><strong>5.</strong> Shop owner enters key in their dashboard to receive credits</li>
                                </ol>
                            </div>
                        </div>
                    )}

                    {/* System Control Tab */}
                    {activeTab === 'system' && (
                        <div className="space-y-6">
                            <h3 className="text-xl font-semibold">System Control</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white border border-gray-200 rounded-lg p-6">
                                    <h4 className="font-semibold mb-4">Coupon Management</h4>
                                    <div className="space-y-4">
                                        <div>
                                            <h5 className="text-sm font-medium text-gray-700 mb-2">Active Coupons ({allCoupons.length})</h5>
                                            <div className="max-h-40 overflow-y-auto space-y-2">
                                                {allCoupons.slice(0, 10).map(coupon => (
                                                    <div key={coupon.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                                        <div>
                                                            <div className="text-sm font-medium">{coupon.title}</div>
                                                            <div className="text-xs text-gray-500">Uses: {coupon.usesLeft}/{coupon.maxUses}</div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleDeleteCoupon(coupon.id)}
                                                            className="text-red-500 hover:text-red-700"
                                                        >
                                                            <TrashIcon className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white border border-gray-200 rounded-lg p-6">
                                    <h4 className="font-semibold mb-4">System Settings</h4>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">Maintenance Mode</span>
                                            <button
                                                onClick={() => setSystemMaintenance(!systemMaintenance)}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${systemMaintenance ? 'bg-red-600' : 'bg-gray-200'}`}
                                            >
                                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${systemMaintenance ? 'translate-x-6' : 'translate-x-1'}`} />
                                            </button>
                                        </div>
                                        
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">New User Registration</span>
                                            <button
                                                onClick={() => setNewUserRegistration(!newUserRegistration)}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${newUserRegistration ? 'bg-green-600' : 'bg-gray-200'}`}
                                            >
                                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${newUserRegistration ? 'translate-x-6' : 'translate-x-1'}`} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Activity Logs Tab */}
                    {activeTab === 'logs' && (
                        <div className="space-y-6">
                            <h3 className="text-xl font-semibold">System Activity Logs</h3>
                            
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {creditLogs.slice(0, 20).map((log) => (
                                            <tr key={log.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {new Date(log.timestamp).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                        log.type === 'Customer Reward' ? 'bg-green-100 text-green-800' :
                                                        log.type === 'Affiliate Commission' ? 'bg-blue-100 text-blue-800' :
                                                        log.type === 'Referrer Bonus' ? 'bg-purple-100 text-purple-800' :
                                                        'bg-gray-100 text-gray-800'
                                                    }`}>
                                                        {log.type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {log.shopName}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    +{log.amount.toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* User Edit Modal */}
            {editMode && selectedUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4">Edit User: {selectedUser.name}</h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Credits</label>
                                <input
                                    type="number"
                                    defaultValue={selectedUser.credits}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                                    onChange={(e) => setSelectedUser({...selectedUser, credits: parseInt(e.target.value)})}
                                />
                            </div>
                            
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleUpdateUserCredits(selectedUser.id, selectedUser.credits)}
                                    disabled={actionLoading}
                                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50"
                                >
                                    {actionLoading ? 'Updating...' : 'Update'}
                                </button>
                                <button
                                    onClick={() => {
                                        setEditMode(false);
                                        setSelectedUser(null);
                                    }}
                                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperAdminDashboard;