import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import { Coupon } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import { logger } from '../utils/logger';

const ValidationPortalPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();

    const [coupon, setCoupon] = useState<Coupon | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isRedeeming, setIsRedeeming] = useState(false);
    const [redeemMessage, setRedeemMessage] = useState('');
    const [showCustomerForm, setShowCustomerForm] = useState(false);
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [customerAddress, setCustomerAddress] = useState('');
    const [customerAge, setCustomerAge] = useState('');
    const [customerGender, setCustomerGender] = useState('');
    const [isSubmittingData, setIsSubmittingData] = useState(false);
    const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
    
    const queryParams = new URLSearchParams(location.search);
    const affiliateId = queryParams.get('affiliateId');

    useEffect(() => {
        const fetchCoupon = async () => {
            if (!id) return;
            setLoading(true);
            try {
                const data = await api.getCouponById(id);
                if (data) setCoupon(data);
                else setError(t('validationPortal.notFound'));
            } catch (err) {
                setError(t('validationPortal.loadError'));
            } finally {
                setLoading(false);
            }
        };
        fetchCoupon();
    }, [id, t]);

    const handleRedeem = async () => {
        if (!id || !user) return;
        
        // Show customer form first
        if (!showCustomerForm) {
            setShowCustomerForm(true);
            return;
        }
        
        // Comprehensive validation of customer data
        const errors: {[key: string]: string} = {};
        
        if (!customerName.trim()) {
            errors.name = 'Full name is required';
        } else if (customerName.trim().length < 2) {
            errors.name = 'Please enter your full name (at least 2 characters)';
        }
        
        if (!customerPhone.trim()) {
            errors.phone = 'Phone number is required';
        } else {
            const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,}$/;
            if (!phoneRegex.test(customerPhone.trim())) {
                errors.phone = 'Please provide a valid phone number (at least 10 digits)';
            }
        }
        
        if (customerEmail && customerEmail.trim()) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(customerEmail.trim())) {
                errors.email = 'Please provide a valid email address';
            }
        }
        
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            setRedeemMessage('Please fix the form errors before proceeding.');
            return;
        }
        
        setFormErrors({});
        
        setIsRedeeming(true);
        setRedeemMessage('');
        
        // Collect comprehensive customer data
        setIsSubmittingData(true);
        const customerData = {
            // Customer Information
            name: customerName.trim(),
            phone: customerPhone.trim(),
            email: customerEmail.trim() || user.email,
            address: customerAddress.trim(),
            age: customerAge ? parseInt(customerAge) : null,
            gender: customerGender || null,
            
            // User Account Info
            userId: user.id,
            userEmail: user.email,
            userAccountName: user.name,
            
            // Coupon Information  
            couponId: id,
            couponTitle: coupon?.title || 'Unknown Coupon', // Fixed: was offerTitle, should be title
            shopOwnerId: coupon?.shopOwnerId || 'unknown',
            shopOwnerName: coupon?.shopOwnerName || 'Unknown Shop',
            discountType: coupon?.discountType || 'percentage',
            discountValue: coupon?.discountValue || 0,
            
            // Redemption Context
            redeemedAt: new Date().toISOString(),
            redemptionLocation: window.location.href,
            affiliateId: affiliateId || null,
            redemptionIP: 'client-side', // Could be enhanced with IP detection
            userAgent: navigator.userAgent,
            
            // Ensure we have all required fields for shop owner visibility
            customerRewardPoints: coupon?.customerRewardPoints || 0,
            affiliateCommission: coupon?.affiliateCommission || 0
        };
        
        // Call the secure API endpoint which triggers the Cloud Function
        logger.debug('🚀 Submitting redemption with customer data:', customerData);
        logger.debug('🎯 Target shop ID:', coupon?.shopOwnerId);
        
        const result = await api.redeemCouponWithCustomerData(id, affiliateId, user.id, customerData);
        logger.debug('📊 Redemption result:', result);
        
        setRedeemMessage(result.message);

        if(result.success) {
            logger.debug('✅ Redemption successful, sending notifications...');
            
            // Send customer data to admin and shop owner via email/notification
            try {
                await api.notifyAdminAndShopOwner(customerData);
                logger.debug('✅ Notifications sent successfully');
            } catch (notifyError) {
                logger.error('⚠️ Notification failed but redemption was successful:', notifyError);
            }
            
            // Add success feedback
            setRedeemMessage('✅ Coupon redeemed successfully! Customer data has been recorded.');
            
            // Delay navigation to show success message
            setTimeout(() => {
                logger.debug('🏠 Navigating to dashboard...');
                navigate('/dashboard');
            }, 3000);
        } else {
            logger.error('❌ Redemption failed:', result.message);
        }
        setIsRedeeming(false);
        setIsSubmittingData(false);
    }

    if (loading) return <div className="text-center p-10">{t('common.loading')}</div>;
    if (error) return <div className="text-center p-10 text-alert">{error}</div>;
    if (!coupon) return null;

    const canRedeem = user; // Any logged-in user can redeem coupons to earn points

    return (
        <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-lg border">
            <h1 className="text-2xl font-bold text-center mb-2">{t('validationPortal.title')}</h1>
            <p className="text-center text-gray-500 mb-6">{t('validationPortal.subtitle')}</p>
            
            <div className="bg-gray-50 p-6 rounded-lg border space-y-3">
                <h3 className="text-lg font-bold text-primary">{coupon.title}</h3>
                <p className="text-sm"><strong>{t('validationPortal.description')}:</strong> {coupon.description}</p>
                <p className="text-sm"><strong>{t('validationPortal.createdBy')}:</strong> {coupon.shopOwnerName}</p>
                <p className="text-sm"><strong>{t('validationPortal.usesLeft')}:</strong> {coupon.usesLeft} / {coupon.maxUses}</p>
                 <p className="text-sm"><strong>{t('validationPortal.couponId')}:</strong> <code className="bg-gray-200 p-1 rounded">{coupon.id}</code></p>
                 {affiliateId && <p className="text-xs text-gray-500 pt-2 border-t mt-2">Affiliate ID: {affiliateId}</p>}
            </div>

            <div className="mt-6">
                {!user && <p className="text-center text-alert">{t('validationPortal.errors.mustBeLoggedIn')}</p>}
                {user && coupon.customerRewardPoints > 0 && (
                    <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200 mb-4">
                        <p className="text-blue-800 font-semibold">🎁 You'll earn {coupon.customerRewardPoints} credits for using this coupon!</p>
                    </div>
                )}
                
                {showCustomerForm && canRedeem && (
                    <div className="bg-gray-50 p-4 rounded-lg border mb-4">
                        <h4 className="font-semibold text-gray-800 mb-3">📝 Customer Information Required</h4>
                        <p className="text-sm text-gray-600 mb-3">Please provide your contact details so the shop owner can verify and contact you later.</p>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Full Name *</label>
                                <input
                                    type="text"
                                    value={customerName}
                                    onChange={(e) => {
                                        setCustomerName(e.target.value);
                                        if (formErrors.name) setFormErrors(prev => ({...prev, name: ''}));
                                    }}
                                    placeholder="Enter your full name"
                                    className={`mt-1 w-full form-input ${formErrors.name ? 'border-red-500' : ''}`}
                                    required
                                />
                                {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Phone Number *</label>
                                <input
                                    type="tel"
                                    value={customerPhone}
                                    onChange={(e) => {
                                        setCustomerPhone(e.target.value);
                                        if (formErrors.phone) setFormErrors(prev => ({...prev, phone: ''}));
                                    }}
                                    placeholder="Enter your phone number (+20 1234567890)"
                                    className={`mt-1 w-full form-input ${formErrors.phone ? 'border-red-500' : ''}`}
                                    required
                                />
                                {formErrors.phone && <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>}
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email (Optional)</label>
                                <input
                                    type="email"
                                    value={customerEmail}
                                    onChange={(e) => {
                                        setCustomerEmail(e.target.value);
                                        if (formErrors.email) setFormErrors(prev => ({...prev, email: ''}));
                                    }}
                                    placeholder="Enter your email address"
                                    className={`mt-1 w-full form-input ${formErrors.email ? 'border-red-500' : ''}`}
                                />
                                {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Age (Optional)</label>
                                    <input
                                        type="number"
                                        value={customerAge}
                                        onChange={(e) => setCustomerAge(e.target.value)}
                                        placeholder="Age"
                                        min="13"
                                        max="120"
                                        className="mt-1 w-full form-input"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Gender (Optional)</label>
                                    <select
                                        value={customerGender}
                                        onChange={(e) => setCustomerGender(e.target.value)}
                                        className="mt-1 w-full form-select"
                                    >
                                        <option value="">Select</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                        <option value="prefer-not-to-say">Prefer not to say</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Address (Optional)</label>
                                <textarea
                                    value={customerAddress}
                                    onChange={(e) => setCustomerAddress(e.target.value)}
                                    placeholder="Enter your address (city, district, street)"
                                    className="mt-1 w-full form-input"
                                    rows={2}
                                />
                            </div>
                        </div>
                        
                        <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
                            <p className="text-xs text-blue-700">
                                🔒 <strong>Privacy Notice:</strong> Your information will be securely shared with the shop owner and admin to verify this coupon redemption and may be used for future service improvements.
                            </p>
                        </div>
                    </div>
                )}
                
                {canRedeem && (
                    <button 
                        onClick={handleRedeem}
                        disabled={isRedeeming || coupon.usesLeft <= 0}
                        className="w-full bg-success text-white font-bold py-3 px-4 rounded-md hover:opacity-90 disabled:opacity-50"
                    >
                        {isRedeeming ? t('validationPortal.processing') : 
                         !showCustomerForm ? 'Redeem Coupon' : 
                         `${t('validationPortal.redeemButton')} (${t('validationPortal.usesLeft')}: ${coupon.usesLeft})`}
                    </button>
                )}
                 {redeemMessage && <p className={`mt-4 text-center text-sm ${redeemMessage.includes('success') ? 'text-success' : 'text-alert'}`}>{redeemMessage}</p>}
            </div>
        </div>
    );
};

export default ValidationPortalPage;
