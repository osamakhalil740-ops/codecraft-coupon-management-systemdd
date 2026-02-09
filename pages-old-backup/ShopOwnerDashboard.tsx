import React, { useState, useEffect, useCallback } from 'react';
import { useRealTimeTracking } from '../hooks/useRealTimeTracking';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Coupon, Referral, CreateCouponData, CreditRequest, CreditKey } from '../types';
import { sanitizeCouponData, validateCouponData, prepareCouponData } from '../utils/couponDataSanitizer';
import { useAuth } from '../hooks/useAuth';
import { logger } from '../utils/logger';
import StatCard from '../components/StatCard';
import { TicketIcon, GiftIcon, BanknotesIcon, EyeIcon, CreditCardIcon, KeyIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useTranslation } from '../hooks/useTranslation';
import CouponCard from '../components/CouponCard';
import QRCodeModal from '../components/QRCodeModal';
import LocationSelector from '../components/LocationSelector';
import { useSafeAsync } from '../hooks/useSafeAsync';
import { CouponErrorHandler, DataErrorHandler } from '../utils/errorHandler';
import { validateForm, couponValidationRules } from '../utils/validation';
import { LoadingState, CardSkeleton, EmptyState } from '../components/LoadingState';

const CreateCouponForm: React.FC<{ onCouponCreated: () => void }> = ({ onCouponCreated }) => {
    const { user } = useAuth();
    const { t } = useTranslation();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [maxUses, setMaxUses] = useState(100);
    const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
    const [discountValue, setDiscountValue] = useState(10);
    const [validityType, setValidityType] = useState<'expiryDate' | 'days'>('expiryDate');
    const [expiryDate, setExpiryDate] = useState('');
    const [validityDays, setValidityDays] = useState(30);
    const [affiliateCommission, setAffiliateCommission] = useState(5);
    const [customerRewardPoints, setCustomerRewardPoints] = useState(10);
    
    // NEW: Only "Valid Globally" toggle - location comes from shop owner profile
    const [isGlobal, setIsGlobal] = useState(false); // Default to shop location
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setIsSubmitting(true);
        setError('');
        
        try {
            // Client-side validation first
            const formData = {
                title: title.trim(),
                description: description.trim(),
                maxUses,
                discountValue,
                affiliateCommission,
                customerRewardPoints,
                ...(validityType === 'days' ? { validityDays } : { expiryDate })
            };

            const clientValidation = validateForm(formData, couponValidationRules);
            if (!clientValidation.isValid) {
                const firstError = Object.values(clientValidation.errors)[0];
                throw new Error(firstError);
            }

            // Prepare coupon data with proper sanitization
            // IMPORTANT: Location comes from shop owner's profile, not from form
            const rawCouponData: Partial<CreateCouponData> = {
                shopOwnerId: user.id,
                title: title.trim(),
                description: description.trim(),
                maxUses,
                discountType,
                discountValue,
                validityType,
                expiryDate: validityType === 'expiryDate' ? expiryDate : undefined,
                validityDays: validityType === 'days' ? validityDays : undefined,
                affiliateCommission,
                customerRewardPoints,
                // Location is determined by shop owner's profile and isGlobal flag
                isGlobal: isGlobal
            };

            // Server-side validation
            const validation = validateCouponData(rawCouponData as CreateCouponData);
            if (!validation.isValid) {
                throw new Error(validation.errors.join(', '));
            }

            const newCouponData = prepareCouponData(rawCouponData);
            await api.createCoupon(newCouponData, user);
            
            // SUCCESS - Show success message
            logger.debug('✅ Coupon created successfully! Refreshing data...');
            
            // Call the refresh callback
            onCouponCreated();
            
            // Reset form
            setTitle('');
            setDescription('');
            setIsGlobal(false); // Reset to shop location
            
            // Show success feedback
            alert('✅ Coupon created successfully! It should appear in your list shortly.');
            
        } catch (err: any) {
            const errorMessage = CouponErrorHandler.create(err, user?.id);
            setError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-lg border space-y-4 animate-slideInUp">
            <h3 className="text-xl font-semibold text-dark-gray">{t('shopOwner.createCoupon.title')}</h3>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800 font-medium">
                    💰 Cost: 50 credits per coupon
                </p>
                <p className="text-xs text-blue-600 mt-1">
                    Each coupon you create will cost exactly 50 credits regardless of settings
                </p>
            </div>
            
            <input type="text" placeholder={t('shopOwner.createCoupon.couponTitle')} value={title} onChange={e => setTitle(e.target.value)} required className="w-full form-input"/>
            <textarea placeholder={t('shopOwner.createCoupon.description')} value={description} onChange={e => setDescription(e.target.value)} required className="w-full form-textarea" rows={2}/>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">{t('shopOwner.createCoupon.discountType')}</label>
                    <select value={discountType} onChange={e => setDiscountType(e.target.value as any)} className="w-full form-select">
                        <option value="percentage">{t('shopOwner.createCoupon.percentage')}</option>
                        <option value="fixed">{t('shopOwner.createCoupon.fixedAmount')}</option>
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">{t('shopOwner.createCoupon.discountValue')}</label>
                    <input type="number" value={discountValue} onChange={e => setDiscountValue(Number(e.target.value))} required className="w-full form-input"/>
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">{t('shopOwner.createCoupon.validityType')}</label>
                    <select value={validityType} onChange={e => setValidityType(e.target.value as any)} className="w-full form-select">
                        <option value="expiryDate">{t('shopOwner.createCoupon.expiryDate')}</option>
                        <option value="days">{t('shopOwner.createCoupon.validityDays')}</option>
                    </select>
                </div>
                {validityType === 'expiryDate' ? (
                     <div>
                        <label className="block text-sm font-medium text-gray-700">{t('shopOwner.createCoupon.expiryDate')}</label>
                        <input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} required className="w-full form-input"/>
                    </div>
                ) : (
                     <div>
                        <label className="block text-sm font-medium text-gray-700">{t('shopOwner.createCoupon.validityDays')}</label>
                        <input type="number" value={validityDays} onChange={e => setValidityDays(Number(e.target.value))} required className="w-full form-input"/>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">{t('shopOwner.createCoupon.maxUses')}</label>
                    <input type="number" value={maxUses} onChange={e => setMaxUses(Number(e.target.value))} required className="w-full form-input"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">{t('shopOwner.createCoupon.affiliateCommission')}</label>
                    <input type="number" value={affiliateCommission} onChange={e => setAffiliateCommission(Number(e.target.value))} required className="w-full form-input"/>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Customer Reward Points</label>
                <input 
                    type="number" 
                    value={customerRewardPoints} 
                    onChange={e => setCustomerRewardPoints(Number(e.target.value))} 
                    required 
                    className="w-full form-input"
                    placeholder="Points awarded to customer who redeems this coupon"
                />
                <p className="text-xs text-gray-500 mt-1">Points credited to customer when they redeem this coupon</p>
            </div>

            {/* Valid Globally Toggle */}
            <div className="border-t pt-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <input
                            type="checkbox"
                            id="isGlobal"
                            checked={isGlobal}
                            onChange={(e) => setIsGlobal(e.target.checked)}
                            className="mt-1 h-5 w-5 text-primary rounded focus:ring-primary"
                        />
                        <div className="flex-1">
                            <label htmlFor="isGlobal" className="block text-sm font-semibold text-gray-800 cursor-pointer">
                                🌍 Valid Globally
                            </label>
                            <p className="text-xs text-gray-600 mt-1">
                                {isGlobal 
                                    ? '✅ This coupon will be valid worldwide for all locations'
                                    : `📍 This coupon will be valid only in your shop location: ${user.city}, ${user.country}${user.district ? `, ${user.district}` : ''}`
                                }
                            </p>
                        </div>
                    </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                    💡 <strong>Tip:</strong> Uncheck to limit the coupon to your shop's location. Check to make it available globally.
                </p>
            </div>

            {error && <p className="text-alert text-sm">{error}</p>}
            
            <button type="submit" disabled={isSubmitting} className="w-full bg-primary text-white font-bold py-3 px-6 rounded-lg hover:opacity-90 disabled:opacity-50 transition-all shadow-md hover:shadow-lg transform hover:scale-105">
                {isSubmitting ? t('shopOwner.createCoupon.creating') : t('shopOwner.createCoupon.createButton')}
            </button>
        </form>
    );
};

const ReferralSection: React.FC = () => {
    const { user } = useAuth();
    const { t } = useTranslation();
    const [copied, setCopied] = useState(false);

    if (!user) return null;

    const referralLink = `${window.location.origin}/#/refer/${user.id}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
         <div className="bg-white p-6 rounded-xl shadow-lg border animate-slideInUp">
            <h3 className="text-xl font-semibold text-dark-gray mb-4">{t('shopOwner.referral.title')}</h3>
            <p className="text-sm text-gray-600 mb-4">{t('shopOwner.referral.description')}</p>
            <div className="flex">
                <input type="text" readOnly value={referralLink} className="text-sm w-full bg-gray-100 form-input read-only:bg-gray-100 rounded-r-none focus:ring-0"/>
                <button onClick={handleCopy} className="bg-primary text-white font-semibold px-4 rounded-r-lg text-sm hover:opacity-90 min-w-[80px] transition-all transform hover:scale-105">
                    {copied ? t('common.copied') : t('common.copy')}
                </button>
            </div>
        </div>
    );
}

const ShopOwnerDashboard: React.FC = () => {
    const { user, refreshUser } = useAuth();
    const { t } = useTranslation();
    const safeAsync = useSafeAsync();
    
    // CRITICAL FIX: Disable real-time tracking for shop owners to prevent Firestore errors
    // Shop owners don't need real-time tracking - it causes "FIRESTORE INTERNAL ASSERTION FAILED"
    const { trackingData, trackUserAction } = useRealTimeTracking(
        user?.roles || [], 
        user?.id,
        false // Disable real-time listeners for shop owners
    );
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [referrals, setReferrals] = useState<Referral[]>([]);
    const [creditRequests, setCreditRequests] = useState<CreditRequest[]>([]);
    const [availableKeys, setAvailableKeys] = useState<CreditKey[]>([]);
    const [modalInfo, setModalInfo] = useState<{url: string} | null>(null);
    
    // NEW: Complete visibility data
    const [couponRedemptions, setCouponRedemptions] = useState<any[]>([]);
    const [affiliateActivity, setAffiliateActivity] = useState<any[]>([]);
    const [customerData, setCustomerData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Real-time customer data integration
    useEffect(() => {
        if (trackingData && trackingData.customerData && trackingData.customerData.length > 0) {
            // Filter customer data for this shop owner
            const shopCustomerData = trackingData.customerData.filter(
                customer => customer.shopOwnerId === user?.id
            );
            setCustomerData(shopCustomerData);
            logger.debug('Shop owner received customer interactions', { count: shopCustomerData.length });
        }
    }, [trackingData?.customerData, user?.id]);
    const [activeTab, setActiveTab] = useState<'overview' | 'redemptions' | 'affiliates' | 'customers'>('overview');
    
    // Credit request form
    const [showCreditRequestForm, setShowCreditRequestForm] = useState(false);
    const [requestAmount, setRequestAmount] = useState(1000);
    const [requestMessage, setRequestMessage] = useState('');
    const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
    
    // Key activation form
    const [showKeyActivation, setShowKeyActivation] = useState(false);
    const [activationKey, setActivationKey] = useState('');
    const [isActivatingKey, setIsActivatingKey] = useState(false);
    const [keyActivationMessage, setKeyActivationMessage] = useState('');

    const fetchData = useCallback(async () => {
        if (!user) {
            logger.warn('⚠️ fetchData called but no user found');
            return;
        }
        
        logger.debug(`🔄 fetchData called for user: ${user.id}`);
        setLoading(true);
        await safeAsync(async () => {
            try {
                logger.debug('📡 Fetching all shop owner data...');
                const [shopCoupons, shopReferrals, shopCreditRequests, shopCreditKeys, redemptions, affiliates, customers] = await Promise.all([
                    api.getCouponsForShop(user.id),
                    api.getReferralsForShop(user.id),
                    api.getCreditRequestsForShop(user.id),
                    api.getCreditKeysForShop(user.id),
                    api.getRedemptionsForShop(user.id),
                    api.getAffiliatesForShop(user.id),
                    api.getCustomerDataForShop(user.id)
                ]);
                
                logger.debug(`✅ Data fetched successfully:`, {
                    coupons: shopCoupons.length,
                    referrals: shopReferrals.length,
                    redemptions: redemptions.length,
                    customers: customers.length
                });
                
                // Update all state with new data
                setCoupons(shopCoupons);
                setReferrals(shopReferrals);
                setCreditRequests(shopCreditRequests);
                setCouponRedemptions(redemptions);
                setAffiliateActivity(affiliates);
                setCustomerData(customers);
                
                // Filter to show only unused keys
                setAvailableKeys(shopCreditKeys.filter(key => !key.isUsed && new Date(key.expiresAt) > new Date()));
                
                logger.debug('✅ Shop Owner Dashboard Data loaded and state updated', {
                    couponsInState: shopCoupons.length,
                    redemptions: redemptions.length,
                    customers: customers.length
                });
                
                // Force component re-render by updating loading state
                setLoading(false);
            } catch (error) {
                logger.error('❌ Error fetching shop owner data:', error);
                DataErrorHandler.fetch(error, 'shop-owner-dashboard');
            } finally {
                setLoading(false);
            }
        });
    }, [user, safeAsync]);

    const handleSubmitCreditRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        
        setIsSubmittingRequest(true);
        try {
            await api.submitCreditRequest(user.id, requestAmount, requestMessage);
            setShowCreditRequestForm(false);
            setRequestAmount(1000);
            setRequestMessage('');
            await fetchData(); // Refresh data
        } catch (error: any) {
            alert('Failed to submit request: ' + error.message);
        } finally {
            setIsSubmittingRequest(false);
        }
    };

    const handleActivateKey = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        
        setIsActivatingKey(true);
        setKeyActivationMessage('');
        try {
            const result = await api.activateCreditKey(activationKey, user.id);
            setKeyActivationMessage(result.message);
            if (result.success) {
                setActivationKey('');
                setShowKeyActivation(false);
                await refreshUser(); // Refresh user credits
                await fetchData();
            }
        } catch (error: any) {
            setKeyActivationMessage('Failed to activate key: ' + error.message);
        } finally {
            setIsActivatingKey(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    if (!user) return null;
    
    if (loading) {
        return <LoadingState message="Loading your dashboard..." />;
    }
    
    const referralCreditsEarned = referrals.filter(r => r.status === 'rewarded').length * 10000;
    const totalCouponViews = coupons.reduce((sum, coupon) => sum + (coupon.clicks || 0), 0);
    
    const handleShare = (couponId: string) => {
        const url = `${window.location.origin}/#/coupon/${couponId}`;
        setModalInfo({ url });
    };

    return (
        <div className="space-y-8 animate-fadeIn">
            {modalInfo && <QRCodeModal url={modalInfo.url} onClose={() => setModalInfo(null)} />}
            {/* Business Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-8 rounded-xl shadow-lg">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">🏪 Business Dashboard</h1>
                        <p className="text-indigo-100 mt-2">Welcome back, {user.name}! Manage your store and coupons.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <div className="text-sm text-indigo-200">Business Credits</div>
                            <div className="text-4xl font-bold">{user.credits.toLocaleString()}</div>
                            {user.credits < 100 && (
                                <div className="text-xs text-red-200 mt-1 flex items-center gap-1">
                                    <ExclamationTriangleIcon className="h-4 w-4" />
                                    Low credits - Cannot create coupons
                                </div>
                            )}
                            {user.credits >= 100 && user.credits < 250 && (
                                <div className="text-xs text-orange-200 mt-1 flex items-center gap-1">
                                    <ExclamationTriangleIcon className="h-4 w-4" />
                                    Low credit balance
                                </div>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowCreditRequestForm(true)}
                                className="bg-green-600 bg-opacity-80 hover:bg-opacity-100 px-4 py-2 rounded-lg transition-all font-medium flex items-center gap-2"
                            >
                                <CreditCardIcon className="h-4 w-4" />
                                Request Credits
                            </button>
                            <button
                                onClick={() => setShowKeyActivation(true)}
                                className="bg-blue-600 bg-opacity-80 hover:bg-opacity-100 px-4 py-2 rounded-lg transition-all font-medium flex items-center gap-2"
                            >
                                <KeyIcon className="h-4 w-4" />
                                Activate Key
                            </button>
                            <Link 
                                to="/profile" 
                                className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition-all font-medium"
                            >
                                Edit Profile
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Business Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Revenue Credits" 
                    value={user.credits.toLocaleString()}
                    icon={<BanknotesIcon className="h-6 w-6"/>} 
                    color="green" 
                />
                <StatCard 
                    title="Active Campaigns" 
                    value={coupons.length}
                    icon={<TicketIcon className="h-6 w-6"/>} 
                    color="indigo" 
                />
                <StatCard 
                    title="Campaign Views" 
                    value={totalCouponViews.toLocaleString()}
                    icon={<EyeIcon className="h-6 w-6"/>} 
                    color="blue" 
                />
                <StatCard 
                    title="Network Bonus" 
                    value={`${referralCreditsEarned.toLocaleString()} credits`}
                    icon={<GiftIcon className="h-6 w-6"/>} 
                    color="purple" 
                />
            </div>

            {/* Activation Keys Section */}
            {availableKeys.length > 0 && (
                <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-6 animate-slideInUp">
                    <h3 className="text-xl font-semibold text-green-800 mb-4 flex items-center gap-2">
                        <KeyIcon className="h-6 w-6" />
                        🎉 Your Activation Keys Available
                    </h3>
                    
                    <div className="space-y-3">
                        {availableKeys.map(key => (
                            <div key={key.id} className="bg-white border border-green-200 rounded-lg p-4">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h4 className="font-semibold text-gray-800">
                                            {key.creditAmount.toLocaleString()} Credits Ready
                                        </h4>
                                        <p className="text-sm text-gray-600">
                                            Generated: {new Date(key.createdAt).toLocaleDateString()}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Expires: {new Date(key.expiresAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                                        Ready to Use
                                    </span>
                                </div>
                                
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3">
                                    <p className="text-xs text-gray-600 mb-2">Your Activation Key:</p>
                                    <div className="flex items-center gap-2">
                                        <code className="flex-1 bg-white border rounded px-3 py-2 font-mono text-sm text-blue-600 font-bold">
                                            {key.keyCode}
                                        </code>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(key.keyCode);
                                                alert('Key copied to clipboard!');
                                            }}
                                            className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                                        >
                                            Copy
                                        </button>
                                    </div>
                                </div>
                                
                                <button
                                    onClick={() => {
                                        setActivationKey(key.keyCode);
                                        setShowKeyActivation(true);
                                    }}
                                    className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 font-medium"
                                >
                                    🚀 Activate {key.creditAmount} Credits Now
                                </button>
                            </div>
                        ))}
                    </div>
                    
                    <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                        <p className="text-sm text-blue-800">
                            💡 <strong>Quick Activation:</strong> Click the "Activate" button below each key, or copy the key and use the "Activate Key" button in the header.
                        </p>
                    </div>
                </div>
            )}

            {/* Navigation Tabs */}
            <div className="flex flex-wrap gap-3 mb-8">
                {[
                    { id: 'overview', label: '📊 Overview', icon: '📊' },
                    { id: 'redemptions', label: '🎫 Redemptions', icon: '🎫' },
                    { id: 'affiliates', label: '📈 Affiliates', icon: '📈' },
                    { id: 'customers', label: '👥 Customers', icon: '👥' }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                            activeTab === tab.id 
                                ? 'bg-primary text-white shadow-lg' 
                                : 'bg-white text-gray-600 hover:bg-slate-100 border'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    <div className="lg:col-span-2 space-y-8">
                        <ReferralSection />
                        <div className="animate-slideInUp" style={{animationDelay: '100ms'}}>
                            <h2 className="text-2xl font-semibold text-dark-gray mb-4">{t('shopOwner.myCoupons')}</h2>
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                {coupons.map(coupon => (
                                    <CouponCard key={coupon.id} coupon={coupon}>
                                        <button onClick={() => handleShare(coupon.id)} className="w-full bg-primary text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 transition-all shadow-md hover:shadow-lg transform hover:scale-105">
                                            {t('shopOwner.shareCoupon')}
                                        </button>
                                    </CouponCard>
                                ))}
                            </div>
                            {coupons.length === 0 && <p className="text-center p-4 bg-white rounded-xl shadow-lg border text-gray-500">{t('user.noCoupons.title')}</p>}
                        </div>
                    </div>
                    <div className="space-y-8">
                        <CreateCouponForm onCouponCreated={fetchData} />
                        <div className="animate-slideInUp" style={{animationDelay: '200ms'}}>
                            <h3 className="text-xl font-semibold text-dark-gray mb-4">{t('shopOwner.myReferrals')}</h3>
                            <div className="bg-white rounded-xl shadow-lg border">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-700 uppercase bg-slate-100 rounded-t-lg">
                                        <tr>
                                            <th className="px-4 py-3">{t('shopOwner.referralsTable.shopName')}</th>
                                            <th className="px-4 py-3">{t('shopOwner.referralsTable.status')}</th>
                                            <th className="px-4 py-3">{t('shopOwner.referralsTable.signupDate')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {referrals.map(ref => (
                                            <tr key={ref.id} className="border-b hover:bg-slate-50 transition-colors">
                                                <td className="px-4 py-3 font-medium">{ref.referredShopName}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${ref.status === 'rewarded' ? 'bg-green-100 text-success' : 'bg-yellow-100 text-pending'}`}>
                                                        {t(`referralStatus.${ref.status}`)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">{new Date(ref.signupDate).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {referrals.length === 0 && <p className="text-center p-4 text-gray-500">{t('shopOwner.noReferrals')}</p>}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* REDEMPTIONS TAB - Complete visibility */}
            {activeTab === 'redemptions' && (
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-lg border overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b">
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">🎫 All Coupon Redemptions</h2>
                            <p className="text-gray-600">Complete visibility into every redemption of your coupons</p>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-xs text-gray-700 uppercase">
                                    <tr>
                                        <th className="px-6 py-3 text-left">Date & Time</th>
                                        <th className="px-6 py-3 text-left">Coupon Details</th>
                                        <th className="px-6 py-3 text-left">Complete Customer Info</th>
                                        <th className="px-6 py-3 text-left">Redemption Chain</th>
                                        <th className="px-6 py-3 text-left">Affiliate Partner</th>
                                        <th className="px-6 py-3 text-left">Financial Impact</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {couponRedemptions.map((redemption) => (
                                        <tr key={redemption.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900">
                                                    {redemption.redeemedAt?.toLocaleDateString()}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {redemption.redeemedAt?.toLocaleTimeString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900">{redemption.couponTitle}</div>
                                                <div className="text-xs text-gray-500">ID: {redemption.couponId?.slice(0, 8)}</div>
                                                <div className="text-xs text-blue-600">
                                                    {redemption.discountType === 'percentage' ? `${redemption.discountValue}% OFF` : `$${redemption.discountValue} OFF`}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900">{redemption.customerName || 'Anonymous Customer'}</div>
                                                <div className="text-xs text-gray-700">📞 {redemption.customerPhone || 'No phone'}</div>
                                                <div className="text-xs text-gray-700">✉️ {redemption.customerEmail || 'No email'}</div>
                                                {redemption.customerAddress && (
                                                    <div className="text-xs text-gray-600">📍 {redemption.customerAddress}</div>
                                                )}
                                                {redemption.customerAge && (
                                                    <div className="text-xs text-gray-600">👤 Age: {redemption.customerAge}, {redemption.customerGender || 'N/A'}</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="text-xs font-medium text-gray-800">🏪 Your Shop</div>
                                                    <div className="text-xs">↓</div>
                                                    {redemption.affiliateId ? (
                                                        <>
                                                            <div className="text-xs font-medium text-blue-700">📈 {redemption.affiliateName || 'Affiliate Partner'}</div>
                                                            <div className="text-xs">↓</div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="text-xs text-gray-500">⚡ Direct Access</div>
                                                            <div className="text-xs">↓</div>
                                                        </>
                                                    )}
                                                    <div className="text-xs font-medium text-green-700">👤 {redemption.customerName || 'Customer'}</div>
                                                </div>
                                                <span className={`mt-2 inline-block px-2 py-1 text-xs font-medium rounded-full ${
                                                    redemption.affiliateId ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                                }`}>
                                                    {redemption.affiliateId ? 'Via Affiliate' : 'Direct Customer'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {redemption.affiliateId ? (
                                                    <div className="space-y-1">
                                                        <div className="text-sm font-medium text-gray-900">{redemption.affiliateName || 'Partner'}</div>
                                                        <div className="text-xs text-gray-500">ID: {redemption.affiliateId?.slice(0, 8)}</div>
                                                        <div className="text-xs text-blue-600">💰 Earned: {redemption.commissionEarned || 0} credits</div>
                                                        <div className="text-xs text-green-600">🎯 Performance: Active</div>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-1">
                                                        <span className="text-sm text-gray-500">No affiliate involved</span>
                                                        <div className="text-xs text-green-600">💰 Full revenue retained</div>
                                                        <div className="text-xs text-blue-600">⚡ Direct customer acquisition</div>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="text-sm font-medium text-green-600">
                                                        💰 Commission: {redemption.commissionEarned ? `${redemption.commissionEarned} credits` : 'None'}
                                                    </div>
                                                    <div className="text-xs text-gray-600">
                                                        🎁 Customer earned: {redemption.customerRewardPoints || 0} points
                                                    </div>
                                                    <div className="text-xs text-blue-600">
                                                        📊 Net impact: {redemption.affiliateId ? 'Commission paid' : 'Full retention'}
                                                    </div>
                                                    <div className="text-xs text-purple-600">
                                                        🎯 Acquisition cost: {redemption.commissionEarned ? `${redemption.commissionEarned} credits` : 'Free'}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {couponRedemptions.length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                    No redemptions yet
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* AFFILIATES TAB - Who promoted your coupons */}
            {activeTab === 'affiliates' && (
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-lg border overflow-hidden">
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 border-b">
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">📈 Affiliate Partners</h2>
                            <p className="text-gray-600">All affiliates who promoted your coupons and their performance</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                            {affiliateActivity.map((affiliate) => (
                                <div key={affiliate.affiliateId} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6 border">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold text-gray-800">{affiliate.affiliateName}</h3>
                                        <span className="text-xs text-gray-500">ID: {affiliate.affiliateId?.slice(0, 8)}</span>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Total Redemptions</span>
                                            <span className="text-sm font-semibold text-blue-600">{affiliate.totalRedemptions}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Commission Earned</span>
                                            <span className="text-sm font-semibold text-green-600">{affiliate.totalCommission} credits</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Latest Activity</span>
                                            <span className="text-xs text-gray-500">
                                                {affiliate.redemptions[0]?.redeemedAt?.toLocaleDateString() || 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                        <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Redemptions</h4>
                                        <div className="space-y-1 max-h-24 overflow-y-auto">
                                            {affiliate.redemptions.slice(0, 3).map((redemption: any, idx: number) => (
                                                <div key={idx} className="text-xs text-gray-600 flex justify-between">
                                                    <span>{redemption.couponTitle?.slice(0, 20)}...</span>
                                                    <span>{redemption.redeemedAt?.toLocaleDateString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        {affiliateActivity.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                No affiliate partners yet
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* CUSTOMERS TAB - Customer data from redemptions */}
            {activeTab === 'customers' && (
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-lg border overflow-hidden">
                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 border-b">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-800 mb-2">👥 Customer Database</h2>
                                    <p className="text-gray-600">Complete customer information from all coupon redemptions</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={fetchData}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium flex items-center gap-2"
                                    >
                                        🔄 Refresh Data
                                    </button>
                                    {/* Debug button removed for production */}
                                </div>
                            </div>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-xs text-gray-700 uppercase">
                                    <tr>
                                        <th className="px-6 py-3 text-left">Customer Identity</th>
                                        <th className="px-6 py-3 text-left">Complete Contact Information</th>
                                        <th className="px-6 py-3 text-left">Demographics & Profile</th>
                                        <th className="px-6 py-3 text-left">Redemption Details</th>
                                        <th className="px-6 py-3 text-left">Acquisition Source</th>
                                        <th className="px-6 py-3 text-left">Customer Value</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {customerData.map((customer) => (
                                        <tr key={customer.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900">{customer.customerName || 'Anonymous Customer'}</div>
                                                <div className="text-xs text-gray-500">User ID: {customer.userId?.slice(0, 8)}</div>
                                                <div className="text-xs text-blue-600">
                                                    Redemption ID: {customer.id?.slice(0, 8)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="text-sm font-medium text-gray-900">📞 {customer.customerPhone || 'No phone provided'}</div>
                                                    <div className="text-sm text-gray-700">✉️ {customer.customerEmail || 'No email provided'}</div>
                                                    {customer.customerAddress && (
                                                        <div className="text-xs text-gray-600">📍 {customer.customerAddress}</div>
                                                    )}
                                                    <div className="text-xs text-gray-500">
                                                        Contact Status: {(customer.customerPhone && customer.customerEmail) ? 'Complete' : 'Partial'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="text-sm text-gray-900">
                                                        👤 Age: {customer.customerAge || 'Not provided'}
                                                    </div>
                                                    <div className="text-sm text-gray-700">
                                                        ⚧ Gender: {customer.customerGender || 'Not specified'}
                                                    </div>
                                                    <div className="text-xs text-blue-600">
                                                        Profile: {(customer.customerAge && customer.customerGender) ? 'Complete' : 'Basic'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="text-sm font-medium text-gray-900">{customer.couponTitle}</div>
                                                    <div className="text-xs text-gray-600">
                                                        🗓️ {customer.redeemedAt?.toLocaleDateString()} at {customer.redeemedAt?.toLocaleTimeString()}
                                                    </div>
                                                    <div className="text-xs text-green-600">
                                                        💰 Discount: {customer.discountType === 'percentage' ? `${customer.discountValue}% OFF` : `$${customer.discountValue} OFF`}
                                                    </div>
                                                    <div className="text-xs text-purple-600">
                                                        🎁 Points earned: {customer.customerRewardPoints || 0}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                        customer.affiliateId ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                                    }`}>
                                                        {customer.affiliateId ? `Via ${customer.affiliateName || 'Affiliate'}` : 'Direct Customer'}
                                                    </span>
                                                    {customer.affiliateId && (
                                                        <div className="text-xs text-blue-600">
                                                            Affiliate ID: {customer.affiliateId?.slice(0, 8)}
                                                        </div>
                                                    )}
                                                    <div className="text-xs text-gray-500">
                                                        {customer.affiliateId ? 'Affiliate-driven acquisition' : 'Organic customer'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="text-sm font-medium text-green-600">
                                                        💰 Commission Paid: {customer.commissionEarned || 0} credits
                                                    </div>
                                                    <div className="text-xs text-blue-600">
                                                        📊 Acquisition Cost: {customer.affiliateId ? `${customer.commissionEarned || 0} credits` : 'Free'}
                                                    </div>
                                                    <div className="text-xs text-purple-600">
                                                        🎯 Customer LTV: Potential high value
                                                    </div>
                                                    <div className="text-xs text-gray-600">
                                                        📈 ROI: {customer.affiliateId ? 'Measured' : 'Direct profit'}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {customerData.length === 0 && (
                                <div className="text-center py-12 bg-blue-50 border border-blue-200 rounded-lg mx-6 mb-6">
                                    <div className="text-blue-800 font-bold text-lg mb-3">👥 No Customer Data Yet</div>
                                    <div className="text-sm text-gray-700 space-y-2 max-w-md mx-auto">
                                        <p><strong>Customer information will appear here when:</strong></p>
                                        <div className="text-left space-y-1">
                                            <p>✓ Customers redeem your coupons</p>
                                            <p>✓ They provide their contact details during redemption</p>
                                            <p>✓ The redemption process completes successfully</p>
                                        </div>
                                        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                                            <p className="text-green-800 text-xs font-medium">
                                                💡 Create and share coupons to start collecting customer data!
                                            </p>
                                        </div>
                                        {/* Debug info removed for production */}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            
            {/* Credit Request Modal */}
            {showCreditRequestForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4">Request Credits</h3>
                        
                        <form onSubmit={handleSubmitCreditRequest} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Credit Amount
                                </label>
                                <input
                                    type="number"
                                    min="100"
                                    step="100"
                                    value={requestAmount}
                                    onChange={(e) => setRequestAmount(parseInt(e.target.value))}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">Minimum 100 credits</p>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Message
                                </label>
                                <textarea
                                    value={requestMessage}
                                    onChange={(e) => setRequestMessage(e.target.value)}
                                    placeholder="Tell us about your business needs and why you need additional credits..."
                                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                                    rows={4}
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">Admin will contact you externally to discuss payment and credit allocation</p>
                            </div>
                            
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    disabled={isSubmittingRequest}
                                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
                                >
                                    {isSubmittingRequest ? 'Submitting...' : 'Submit Request'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowCreditRequestForm(false)}
                                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                        
                        {creditRequests.length > 0 && (
                            <div className="mt-6 pt-4 border-t">
                                <h4 className="font-medium text-gray-700 mb-2">Recent Requests</h4>
                                <div className="max-h-32 overflow-y-auto">
                                    {creditRequests.slice(0, 3).map(request => (
                                        <div key={request.id} className="text-sm p-2 bg-gray-50 rounded mb-2">
                                            <div className="flex justify-between">
                                                <span>{request.requestedAmount.toLocaleString()} credits</span>
                                                <span className={`px-2 py-0.5 rounded text-xs ${
                                                    request.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                    request.status === 'key_generated' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                    {request.status === 'key_generated' ? 'Key Ready' : request.status}
                                                </span>
                                            </div>
                                            {request.adminResponse && (
                                                <p className="text-gray-600 text-xs mt-1">{request.adminResponse}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
            
            {/* Key Activation Modal */}
            {showKeyActivation && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4">Activate Credit Key</h3>
                        
                        <form onSubmit={handleActivateKey} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Activation Key
                                </label>
                                <input
                                    type="text"
                                    value={activationKey}
                                    onChange={(e) => setActivationKey(e.target.value.toUpperCase())}
                                    placeholder="Enter your activation key"
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 font-mono"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Enter the activation key provided by the admin after external payment confirmation
                                </p>
                            </div>
                            
                            {keyActivationMessage && (
                                <div className={`p-3 rounded-md text-sm ${
                                    keyActivationMessage.includes('Success') ? 
                                    'bg-green-100 text-green-800' : 
                                    'bg-red-100 text-red-800'
                                }`}>
                                    {keyActivationMessage}
                                </div>
                            )}
                            
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    disabled={isActivatingKey}
                                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {isActivatingKey ? 'Activating...' : 'Activate Key'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowKeyActivation(false);
                                        setKeyActivationMessage('');
                                        setActivationKey('');
                                    }}
                                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                        
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-xs text-blue-700">
                                💡 <strong>How it works:</strong> After discussing payment details externally with admin, 
                                you'll receive an activation key. Enter that key here to add the credits to your account.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShopOwnerDashboard;