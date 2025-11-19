
import { db, functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';
import {
    collection,
    query,
    where,
    getDocs,
    getDoc,
    addDoc,
    doc,
    Timestamp,
    orderBy,
    updateDoc,
    serverTimestamp,
    deleteDoc,
    increment,
    runTransaction,
    limit,
} from 'firebase/firestore';
import { Shop, Coupon, Redemption, Referral, AdminCreditLog, CreateCouponData, Role, CreditRequest, CreditKey } from '../types';

const fromFirestore = (doc: any) => {
    const data = doc.data();
    return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
        redeemedAt: data.redeemedAt?.toDate ? data.redeemedAt.toDate().toISOString() : undefined,
        signupDate: data.signupDate?.toDate ? data.signupDate.toDate().toISOString() : undefined,
        timestamp: data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : undefined,
        expiryDate: data.expiryDate?.toDate ? data.expiryDate.toDate().toISOString() : undefined,
        clicks: data.clicks || 0,
    };
}

type ProfileUpdateData = {
    country: string;
    city: string;
    category: string;
    shopDescription: string;
    addressLine1: string;
    addressLine2: string;
    state: string;
    postalCode: string;
};

// Define callable functions for secure backend operations
const redeemCouponCallable = httpsCallable(functions, 'redeemCouponCallable');
const trackCouponClickCallable = httpsCallable(functions, 'trackCouponClickCallable');


export const api = {
    getAllShops: async (): Promise<Shop[]> => {
        const q = query(collection(db, "shops"), where("roles", "array-contains", "shop-owner"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(fromFirestore) as Shop[];
    },
    
    getAllCoupons: async (): Promise<Coupon[]> => {
        const q = query(collection(db, "coupons"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(fromFirestore) as Coupon[];
    },

    getCouponsForShop: async (shopOwnerId: string): Promise<Coupon[]> => {
        const q = query(collection(db, "coupons"), where("shopOwnerId", "==", shopOwnerId));
        const querySnapshot = await getDocs(q);
        const coupons = querySnapshot.docs.map(fromFirestore) as Coupon[];
        return coupons.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },

    getCouponById: async (id: string): Promise<Coupon | null> => {
        const docRef = doc(db, "coupons", id);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? fromFirestore(docSnap) as Coupon : null;
    },

    trackCouponClick: async (couponId: string): Promise<void> => {
        try {
            await trackCouponClickCallable({ couponId });
        } catch (error) {
            console.error("Failed to track coupon click via cloud function:", error);
            try {
                const couponRef = doc(db, "coupons", couponId);
                await updateDoc(couponRef, {
                    clicks: increment(1)
                });
            } catch (fallbackError) {
                console.error("Failed to apply client-side click fallback:", fallbackError);
            }
        }
    },
    
    createCoupon: async (data: CreateCouponData, shopOwner: Shop): Promise<Coupon> => {
        // Fixed cost: 50 credits per coupon
        const couponCost = 50;

        // Check if shop owner has enough credits
        if (shopOwner.credits < couponCost) {
            throw new Error(`Insufficient credits. Need ${couponCost} credits to create a coupon but you have ${shopOwner.credits}. Please request more credits.`);
        }

        // Create coupon and deduct credits in a transaction
        return await runTransaction(db, async (transaction) => {
            const shopRef = doc(db, "shops", shopOwner.id);
            const adminLogsRef = collection(db, "adminCreditLogs");
            
            // Deduct 50 credits from shop owner
            transaction.update(shopRef, {
                credits: increment(-couponCost)
            });

            // Log the cost deduction
            const logRef = doc(adminLogsRef);
            transaction.set(logRef, {
                type: 'Coupon Creation Cost',
                shopId: shopOwner.id,
                shopName: shopOwner.name,
                amount: -couponCost,
                timestamp: serverTimestamp(),
                details: `Created coupon: ${data.title} (50 credits deducted)`
            });

            // Create the coupon
            const newCouponData = {
                ...data,
                shopOwnerName: shopOwner.name,
                usesLeft: data.maxUses,
                clicks: 0,
                creationCost: couponCost,
                createdAt: serverTimestamp(),
                expiryDate: data.expiryDate ? Timestamp.fromDate(new Date(data.expiryDate)) : null,
            };
            const couponsCollection = collection(db, "coupons");
            const newDocRef = doc(couponsCollection);
            transaction.set(newDocRef, newCouponData);
            
            return { 
                ...data, 
                id: newDocRef.id, 
                usesLeft: data.maxUses, 
                shopOwnerName: shopOwner.name, 
                createdAt: new Date().toISOString(), 
                clicks: 0,
                creationCost: couponCost
            };
        });
    },

    redeemCoupon: async (couponId: string, affiliateId?: string | null, customerId?: string): Promise<{ success: boolean; message: string }> => {
        // حاول الأول تستدعي Cloud Function (لو موجودة)
        try {
            const result: any = await redeemCouponCallable({ couponId, affiliateId });
            return result.data as { success: boolean; message: string };
        } catch (e: any) {
            console.warn("Cloud function error, falling back to client-side redeem:", e);
            // Fallback كامل للعمل على Spark
            try {
                const couponRef = doc(db, "coupons", couponId);
                const couponSnap = await getDoc(couponRef);

                if (!couponSnap.exists()) {
                    return { success: false, message: "Coupon not found." };
                }

                const couponData = couponSnap.data() as Coupon & {
                    shopOwnerId: string;
                    shopOwnerName: string;
                    affiliateCommission: number;
                };

                const shopRef = doc(db, "shops", couponData.shopOwnerId);
                const referralQuery = query(
                    collection(db, "referrals"),
                    where("referredId", "==", couponData.shopOwnerId),
                    limit(1)
                );
                const referralSnap = await getDocs(referralQuery);
                const referralDocRef = referralSnap.empty ? null : referralSnap.docs[0].ref;
                let shouldMarkReferralRewarded = false;

                await runTransaction(db, async (transaction) => {
                    // Initialize collection references first
                    const adminLogs = collection(db, "adminCreditLogs");
                    
                    // STEP 1: ALL READS FIRST (Required by Firestore)
                    const couponTxnSnap = await transaction.get(couponRef);
                    if (!couponTxnSnap.exists()) {
                        throw new Error("Coupon not found.");
                    }
                    const couponTxnData = couponTxnSnap.data() as Coupon;

                    const shopSnap = await transaction.get(shopRef);
                    if (!shopSnap.exists()) {
                        throw new Error("Shop owner not found.");
                    }
                    const shopData = shopSnap.data() as Shop;

                    // Read customer data if needed
                    let customerSnap: any = null;
                    let customerData: Shop | null = null;
                    const customerRef = customerId ? doc(db, "shops", customerId) : null;
                    if (customerRef && couponTxnData.customerRewardPoints > 0) {
                        customerSnap = await transaction.get(customerRef);
                        if (customerSnap.exists()) {
                            customerData = customerSnap.data() as Shop;
                        }
                    }

                    // Read affiliate data if needed
                    let affiliateSnap: any = null;
                    let affiliateData: Shop | null = null;
                    if (affiliateId && affiliateId !== couponTxnData.shopOwnerId && couponTxnData.affiliateCommission > 0) {
                        const affiliateRef = doc(db, "shops", affiliateId);
                        affiliateSnap = await transaction.get(affiliateRef);
                        if (affiliateSnap.exists()) {
                            affiliateData = affiliateSnap.data() as Shop;
                        }
                    }

                    // Read referrer data if needed
                    let referrerSnap: any = null;
                    let referrerData: Shop | null = null;
                    let referrerRef: any = null;
                    if (!shopData.hasRedeemedFirstCoupon && shopData.referredBy) {
                        referrerRef = doc(db, "shops", shopData.referredBy);
                        referrerSnap = await transaction.get(referrerRef);
                        if (referrerSnap.exists()) {
                            referrerData = referrerSnap.data() as Shop;
                        }
                    }

                    // STEP 2: VALIDATIONS
                    if (couponTxnData.usesLeft <= 0) {
                        throw new Error("Coupon has no uses left.");
                    }

                    if (
                        couponTxnData.validityType === "expiryDate" &&
                        couponTxnData.expiryDate &&
                        couponTxnData.expiryDate.toDate &&
                        couponTxnData.expiryDate.toDate() < new Date()
                    ) {
                        throw new Error("This coupon has expired.");
                    }

                    // STEP 3: ALL WRITES AFTER ALL READS
                    transaction.update(couponRef, { usesLeft: increment(-1) });

                    // Initialize redemption payload first
                    const redemptionRef = doc(collection(db, "redemptions"));
                    const redemptionPayload: Partial<Redemption> & Record<string, any> = {
                        couponId,
                        couponTitle: couponTxnData.title,
                        shopOwnerId: couponTxnData.shopOwnerId,
                        redeemedAt: serverTimestamp(),
                        customerId: customerId || "unknown",
                    };

                    // Award customer reward points
                    if (couponTxnData.customerRewardPoints > 0 && customerData && customerRef) {
                        transaction.update(customerRef, { 
                            credits: increment(couponTxnData.customerRewardPoints) 
                        });
                        redemptionPayload.customerRewardEarned = couponTxnData.customerRewardPoints;
                        
                        const customerLogRef = doc(adminLogs);
                        transaction.set(customerLogRef, {
                            type: "Customer Reward",
                            shopId: customerId!,
                            shopName: customerData.name,
                            amount: couponTxnData.customerRewardPoints,
                            timestamp: serverTimestamp(),
                        });
                    }

                    // Handle affiliate commission using pre-read data
                    if (affiliateData && affiliateId && affiliateId !== couponTxnData.shopOwnerId && couponTxnData.affiliateCommission > 0) {
                        const affiliateRef = doc(db, "shops", affiliateId);
                        redemptionPayload.affiliateId = affiliateId;
                        redemptionPayload.commissionEarned = couponTxnData.affiliateCommission;
                        transaction.update(affiliateRef, {
                            credits: increment(couponTxnData.affiliateCommission),
                        });
                        const affiliateLogRef = doc(adminLogs);
                        transaction.set(affiliateLogRef, {
                            type: "Affiliate Commission",
                            shopId: affiliateId,
                            shopName: affiliateData.name,
                            amount: couponTxnData.affiliateCommission,
                            timestamp: serverTimestamp(),
                        });
                    }

                    // Handle referrer bonus using pre-read data
                    if (!shopData.hasRedeemedFirstCoupon && shopData.referredBy && referrerData && referrerRef) {
                        transaction.update(shopRef, { hasRedeemedFirstCoupon: true });
                        transaction.update(referrerRef, { credits: increment(10000) });
                        const bonusLogRef = doc(adminLogs);
                        transaction.set(bonusLogRef, {
                            type: "Referrer Bonus",
                            shopId: referrerRef.id,
                            shopName: referrerData.name,
                            amount: 10000,
                            timestamp: serverTimestamp(),
                        });
                        if (referralDocRef) {
                            shouldMarkReferralRewarded = true;
                        }
                    }

                    transaction.set(redemptionRef, redemptionPayload);
                });

                if (shouldMarkReferralRewarded && referralDocRef) {
                    await updateDoc(referralDocRef, { status: "rewarded" });
                }

                return {
                    success: true,
                    message: "Coupon redeemed successfully.",
                };
            } catch (fallbackError: any) {
                console.error("Client-side redeem failed:", fallbackError);
                return {
                    success: false,
                    message: fallbackError.message || "Redeem failed. Please try again.",
                };
            }
        }
    },

    redeemCouponWithCustomerData: async (couponId: string, affiliateId?: string | null, customerId?: string, customerData?: any): Promise<{ success: boolean; message: string }> => {
        // First redeem the coupon normally
        const result = await api.redeemCoupon(couponId, affiliateId, customerId);
        
        if (result.success && customerData) {
            try {
                // Store customer data for admin and shop owner access
                const customerRedemptionsRef = collection(db, "customerRedemptions");
                await addDoc(customerRedemptionsRef, {
                    couponId,
                    customerId,
                    customerName: customerData.name,
                    customerPhone: customerData.phone,
                    customerEmail: customerData.email,
                    redeemedAt: serverTimestamp(),
                    affiliateId: affiliateId || null,
                });
            } catch (error) {
                console.error("Failed to store customer data:", error);
                // Don't fail the whole redemption if customer data storage fails
            }
        }
        
        return result;
    },

    // Notify admin and shop owner about customer redemption
    notifyAdminAndShopOwner: async (customerData: any): Promise<void> => {
        try {
            // Store detailed customer redemption data
            const customerRedemptionRef = collection(db, "detailedCustomerRedemptions");
            await addDoc(customerRedemptionRef, {
                ...customerData,
                timestamp: serverTimestamp(),
                status: 'new',
                adminNotified: true,
                shopOwnerNotified: true
            });

            // Log for admin tracking
            const adminNotificationRef = collection(db, "adminNotifications");
            await addDoc(adminNotificationRef, {
                type: 'CUSTOMER_REDEMPTION',
                title: 'New Customer Redemption',
                message: `Customer ${customerData.name} redeemed coupon: ${customerData.couponTitle}`,
                customerData,
                timestamp: serverTimestamp(),
                read: false,
                urgent: false
            });

            // Log for shop owner tracking
            const shopNotificationRef = collection(db, "shopOwnerNotifications");
            await addDoc(shopNotificationRef, {
                type: 'CUSTOMER_REDEMPTION',
                shopOwnerId: customerData.shopOwnerId || 'unknown',
                title: 'New Customer Redemption',
                message: `Customer ${customerData.name} (${customerData.phone}) redeemed your coupon`,
                customerData,
                timestamp: serverTimestamp(),
                read: false,
                followUpRequired: true
            });

            console.log('Customer data notifications sent successfully');
        } catch (error) {
            console.error('Failed to send customer data notifications:', error);
            // Don't throw error to avoid breaking the redemption flow
        }
    },

    getReferralsForShop: async (shopId: string): Promise<Referral[]> => {
        const q = query(collection(db, "referrals"), where("referrerId", "==", shopId));
        const querySnapshot = await getDocs(q);
        const referrals = querySnapshot.docs.map(fromFirestore) as Referral[];
        return referrals.sort((a, b) => new Date(b.signupDate).getTime() - new Date(a.signupDate).getTime());
    },
    
    getRedemptionsForAffiliate: async (affiliateId: string): Promise<Redemption[]> => {
        const q = query(collection(db, "redemptions"), where("affiliateId", "==", affiliateId));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(fromFirestore) as Redemption[];
    },

    getAllRedemptions: async (): Promise<Redemption[]> => {
        const redemptionsRef = collection(db, "redemptions");
        const q = query(redemptionsRef, orderBy("redeemedAt", "desc"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(fromFirestore) as Redemption[];
    },

    getAllReferrals: async (): Promise<Referral[]> => {
        const referralsRef = collection(db, "referrals");
        const q = query(referralsRef, orderBy("signupDate", "desc"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(fromFirestore) as Referral[];
    },

    getAdminCreditLogs: async (): Promise<AdminCreditLog[]> => {
        const q = query(collection(db, "adminCreditLogs"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(fromFirestore) as AdminCreditLog[];
    },

    getAllUsers: async (): Promise<Shop[]> => {
        const querySnapshot = await getDocs(collection(db, "shops"));
        return querySnapshot.docs.map(fromFirestore) as Shop[];
    },
    
    updateShopProfile: async (shopId: string, data: ProfileUpdateData): Promise<void> => {
        const shopRef = doc(db, 'shops', shopId);
        await updateDoc(shopRef, data);
    },

    updateUserCredits: async (userId: string, credits: number): Promise<void> => {
        const userRef = doc(db, 'shops', userId);
        await updateDoc(userRef, { credits });
    },

    updateUserRoles: async (userId: string, roles: Role[]): Promise<void> => {
        const userRef = doc(db, 'shops', userId);
        await updateDoc(userRef, { roles });
    },

    deleteCoupon: async (couponId: string): Promise<void> => {
        const couponRef = doc(db, 'coupons', couponId);
        await deleteDoc(couponRef);
    },

    deleteUser: async (userId: string): Promise<void> => {
        const userRef = doc(db, 'shops', userId);
        await deleteDoc(userRef);
    },

    // Credit Request System
    submitCreditRequest: async (shopOwnerId: string, requestedAmount: number, message: string): Promise<CreditRequest> => {
        const shopRef = doc(db, "shops", shopOwnerId);
        const shopSnap = await getDoc(shopRef);
        
        if (!shopSnap.exists()) {
            throw new Error("Shop not found");
        }
        
        const shopData = shopSnap.data() as Shop;
        
        const requestData: Omit<CreditRequest, 'id'> = {
            shopOwnerId,
            shopOwnerName: shopData.name,
            shopOwnerEmail: shopData.email,
            requestedAmount,
            status: 'pending',
            message,
            requestedAt: new Date().toISOString()
        };
        
        const requestsCollection = collection(db, "creditRequests");
        const newDocRef = await addDoc(requestsCollection, {
            ...requestData,
            requestedAt: serverTimestamp()
        });
        
        return { ...requestData, id: newDocRef.id };
    },

    getCreditRequests: async (): Promise<CreditRequest[]> => {
        const querySnapshot = await getDocs(collection(db, "creditRequests"));
        const requests = querySnapshot.docs.map(fromFirestore) as CreditRequest[];
        // Sort client-side to avoid needing index
        return requests.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
    },

    getCreditRequestsForShop: async (shopOwnerId: string): Promise<CreditRequest[]> => {
        const q = query(
            collection(db, "creditRequests"), 
            where("shopOwnerId", "==", shopOwnerId)
        );
        const querySnapshot = await getDocs(q);
        const requests = querySnapshot.docs.map(fromFirestore) as CreditRequest[];
        // Sort client-side to avoid needing composite index
        return requests.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
    },

    updateCreditRequest: async (requestId: string, status: 'key_generated' | 'completed', adminResponse: string, adminEmail: string): Promise<void> => {
        const requestRef = doc(db, "creditRequests", requestId);
        await updateDoc(requestRef, {
            status,
            adminResponse,
            processedAt: serverTimestamp(),
            processedBy: adminEmail
        });
    },

    // Credit Key System
    generateCreditKey: async (requestId: string, shopOwnerId: string, creditAmount: number, adminEmail: string): Promise<CreditKey> => {
        // Generate unique key code using shop owner ID and timestamp for uniqueness
        const timestamp = Date.now().toString(36);
        const randomPart = Math.random().toString(36).substring(2, 8);
        const shopPart = shopOwnerId.substring(-4); // Last 4 characters of shop ID
        const keyCode = `${shopPart}-${timestamp}-${randomPart}`.toUpperCase();
        
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30); // Keys expire in 30 days
        
        const keyData: Omit<CreditKey, 'id'> = {
            keyCode,
            requestId,
            shopOwnerId,
            creditAmount,
            isUsed: false,
            createdBy: adminEmail,
            createdAt: new Date().toISOString(),
            expiresAt: expiryDate.toISOString(),
            description: `Credit purchase: ${creditAmount} credits for ${shopOwnerId}`
        };
        
        const keysCollection = collection(db, "creditKeys");
        const newDocRef = await addDoc(keysCollection, {
            ...keyData,
            createdAt: serverTimestamp(),
            expiresAt: Timestamp.fromDate(expiryDate)
        });
        
        return { ...keyData, id: newDocRef.id };
    },

    activateCreditKey: async (keyCode: string, shopOwnerId: string): Promise<{ success: boolean; message: string; creditsAdded?: number }> => {
        // Clean and format the key code
        const cleanKeyCode = keyCode.toUpperCase().trim();
        
        const q = query(
            collection(db, "creditKeys"), 
            where("keyCode", "==", cleanKeyCode),
            where("shopOwnerId", "==", shopOwnerId)
        );
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            return { success: false, message: "Invalid activation key or this key is not assigned to your account. Please check the key and try again." };
        }
        
        const keyDoc = querySnapshot.docs[0];
        const keyData = fromFirestore(keyDoc) as CreditKey;
        
        if (keyData.isUsed) {
            return { success: false, message: "This activation key has already been used and cannot be activated again." };
        }
        
        if (new Date(keyData.expiresAt) < new Date()) {
            return { success: false, message: "This activation key has expired. Please contact the admin for a new key." };
        }
        
        // Activate key and add credits in a transaction
        return await runTransaction(db, async (transaction) => {
            const keyRef = doc(db, "creditKeys", keyData.id);
            const shopRef = doc(db, "shops", shopOwnerId);
            const requestRef = doc(db, "creditRequests", keyData.requestId);
            const adminLogsRef = collection(db, "adminCreditLogs");
            
            // Get fresh shop data
            const shopSnap = await transaction.get(shopRef);
            if (!shopSnap.exists()) {
                throw new Error("Shop account not found");
            }
            const shopData = shopSnap.data() as Shop;
            
            // Mark key as used
            transaction.update(keyRef, {
                isUsed: true,
                usedAt: serverTimestamp()
            });
            
            // Update request status to completed
            transaction.update(requestRef, {
                status: 'completed'
            });
            
            // Add credits to shop account
            transaction.update(shopRef, {
                credits: increment(keyData.creditAmount)
            });
            
            // Log the credit addition for admin tracking
            const logRef = doc(adminLogsRef);
            transaction.set(logRef, {
                type: 'Credit Purchase',
                shopId: shopOwnerId,
                shopName: shopData.name,
                amount: keyData.creditAmount,
                timestamp: serverTimestamp(),
                details: `Activation key used: ${cleanKeyCode} - ${keyData.creditAmount} credits added`
            });
            
            return { 
                success: true, 
                message: `🎉 Success! ${keyData.creditAmount} credits have been added to your account. You can now create more coupons.`,
                creditsAdded: keyData.creditAmount
            };
        });
    },

    getCreditKeys: async (): Promise<CreditKey[]> => {
        const querySnapshot = await getDocs(collection(db, "creditKeys"));
        const keys = querySnapshot.docs.map(fromFirestore) as CreditKey[];
        // Sort client-side to avoid needing index
        return keys.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },

    getCreditKeysForShop: async (shopOwnerId: string): Promise<CreditKey[]> => {
        const q = query(
            collection(db, "creditKeys"), 
            where("shopOwnerId", "==", shopOwnerId)
        );
        const querySnapshot = await getDocs(q);
        const keys = querySnapshot.docs.map(fromFirestore) as CreditKey[];
        // Sort client-side to avoid needing composite index
        return keys.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },

    // Admin credit grant logging
    logAdminCreditGrant: async (shopId: string, shopName: string, amount: number, adminEmail: string): Promise<void> => {
        const adminLogsRef = collection(db, "adminCreditLogs");
        await addDoc(adminLogsRef, {
            type: 'Admin Grant',
            shopId,
            shopName,
            amount,
            timestamp: serverTimestamp(),
            details: `Credits granted by admin: ${adminEmail}`
        });
    },

    // Get comprehensive system activity for admin monitoring
    getSystemActivity: async (): Promise<any[]> => {
        try {
            const collections = [
                'adminNotifications',
                'shopOwnerNotifications', 
                'detailedCustomerRedemptions',
                'adminCreditLogs'
            ];

            const allActivity = [];
            
            for (const collectionName of collections) {
                const q = query(
                    collection(db, collectionName),
                    orderBy('timestamp', 'desc'),
                    limit(50)
                );
                const snapshot = await getDocs(q);
                const activities = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    source: collectionName
                }));
                allActivity.push(...activities);
            }

            // Sort all activity by timestamp
            return allActivity.sort((a, b) => {
                const aTime = a.timestamp?.toDate?.() || new Date(a.timestamp || 0);
                const bTime = b.timestamp?.toDate?.() || new Date(b.timestamp || 0);
                return bTime.getTime() - aTime.getTime();
            }).slice(0, 100); // Return latest 100 activities

        } catch (error) {
            console.error('Error fetching system activity:', error);
            return [];
        }
    }
};
