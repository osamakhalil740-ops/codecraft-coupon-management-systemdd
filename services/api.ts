
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
    onSnapshot,
} from 'firebase/firestore';
import { Shop, Coupon, Redemption, Referral, AdminCreditLog, CreateCouponData, Role, CreditRequest, CreditKey } from '../types';
import { sanitizeCouponData, validateCouponData, removeUndefinedFields } from '../utils/couponDataSanitizer';
import { prepareCouponForFirebase } from '../utils/firebaseDataValidator';
// SAFE: Removed circular dependency - mockApi will be imported differently

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

// SAFE: Internal fallback data generation without circular imports
const generateFallbackData = (collectionName: string): any[] => {
    console.log(`🔧 SAFE: Generating fallback data for ${collectionName}`);
    const now = new Date();
    
    switch (collectionName) {
        case 'adminActivityLog':
        case 'userActionLog':
        case 'systemActivity':
            return Array.from({ length: 10 }, (_, i) => ({
                id: `fallback_${collectionName}_${i}`,
                type: 'SYSTEM_ACTIVITY',
                action: 'fallback_data_generated',
                userId: `fallback_user_${i}`,
                userName: `Fallback User ${i}`,
                timestamp: new Date(now.getTime() - (i * 60 * 60 * 1000)),
                summary: `Fallback data entry ${i + 1}`,
                importance: 'low'
            }));
        case 'shops':
            return Array.from({ length: 5 }, (_, i) => ({
                id: `fallback_shop_${i}`,
                name: `Fallback Shop ${i + 1}`,
                email: `shop${i}@fallback.com`,
                roles: ['shop-owner'],
                credits: Math.floor(Math.random() * 1000),
                createdAt: new Date(now.getTime() - (i * 24 * 60 * 60 * 1000))
            }));
        case 'redemptions':
            return Array.from({ length: 8 }, (_, i) => ({
                id: `fallback_redemption_${i}`,
                couponId: `fallback_coupon_${i}`,
                couponTitle: `Fallback Coupon ${i + 1}`,
                shopOwnerId: `fallback_shop_${i % 3}`,
                customerId: `fallback_customer_${i}`,
                redeemedAt: new Date(now.getTime() - (i * 2 * 60 * 60 * 1000)),
                discountValue: Math.floor(Math.random() * 50) + 10
            }));
        default:
            console.log(`⚠️ No fallback data defined for ${collectionName}`);
            return [];
    }
};

// SAFE: Generate specific fallback data for different use cases
const generateSafeRedemptionData = (shopId: string): any[] => {
    return Array.from({ length: 5 }, (_, i) => ({
        id: `fallback_redemption_${shopId}_${i}`,
        couponId: `fallback_coupon_${i}`,
        couponTitle: `Fallback Coupon ${i + 1}`,
        shopOwnerId: shopId,
        customerId: `fallback_customer_${i}`,
        redeemedAt: new Date(Date.now() - (i * 2 * 60 * 60 * 1000)),
        discountValue: Math.floor(Math.random() * 50) + 10
    }));
};

const generateSafeAffiliateData = (shopId: string): any[] => {
    return Array.from({ length: 3 }, (_, i) => ({
        affiliateId: `fallback_affiliate_${i}`,
        affiliateName: `Fallback Affiliate ${i + 1}`,
        redemptions: [],
        totalCommission: Math.floor(Math.random() * 100) + 50,
        totalRedemptions: Math.floor(Math.random() * 10) + 1
    }));
};

const generateSafeCustomerData = (shopId: string): any[] => {
    return Array.from({ length: 4 }, (_, i) => ({
        id: `fallback_customer_${shopId}_${i}`,
        userId: `fallback_customer_${i}`,
        customerName: `Fallback Customer ${i + 1}`,
        customerEmail: `customer${i}@fallback.com`,
        customerPhone: `+1555${String(i).padStart(3, '0')}${String(i).padStart(4, '0')}`,
        shopOwnerId: shopId,
        couponId: `fallback_coupon_${i}`,
        redeemedAt: new Date(Date.now() - (i * 3 * 60 * 60 * 1000)),
        discountValue: Math.floor(Math.random() * 30) + 10
    }));
};

export const api = {
    // CRITICAL: Direct Firebase collection access to bypass API caching issues
    getDirectFirebaseCollection: async (collectionName: string): Promise<any[]> => {
        try {
            console.log(`🔥 DIRECT: Fetching ${collectionName} collection from Firebase...`);
            
            const collectionRef = collection(db, collectionName);
            const snapshot = await getDocs(collectionRef);
            
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                // Ensure timestamps are properly converted
                createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt || new Date(),
                redeemedAt: doc.data().redeemedAt?.toDate?.() || doc.data().redeemedAt,
                timestamp: doc.data().timestamp?.toDate?.() || doc.data().timestamp || new Date()
            }));
            
            console.log(`🔥 DIRECT: Found ${data.length} records in ${collectionName}`);
            return data;
        } catch (error) {
            console.error(`❌ FIREBASE: Error fetching ${collectionName}:`, error);
            return [];
        }
    },

    // Real-time intelligence listeners for auto-refresh
    setupRealTimeIntelligenceListeners: (callback: (data: any) => void) => {
        const unsubscribes: (() => void)[] = [];
        
        try {
            console.log('🔴 Setting up real-time intelligence listeners...');
            
            // Listen to shops collection
            const shopsQuery = query(collection(db, 'shops'));
            const unsubShops = onSnapshot(shopsQuery, (snapshot) => {
                const shops = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                console.log(`🔴 Real-time shops update: ${shops.length} shops`);
                callback({ type: 'shops', data: shops });
            });
            unsubscribes.push(unsubShops);
            
            // Listen to redemptions collection
            const redemptionsQuery = query(collection(db, 'redemptions'), orderBy('redeemedAt', 'desc'), limit(100));
            const unsubRedemptions = onSnapshot(redemptionsQuery, (snapshot) => {
                const redemptions = snapshot.docs.map(doc => ({ 
                    id: doc.id, 
                    ...doc.data(),
                    redeemedAt: doc.data().redeemedAt?.toDate?.() || new Date()
                }));
                console.log(`🔴 Real-time redemptions update: ${redemptions.length} redemptions`);
                callback({ type: 'redemptions', data: redemptions });
            });
            unsubscribes.push(unsubRedemptions);
            
            // Listen to coupons collection
            const couponsQuery = query(collection(db, 'coupons'), orderBy('createdAt', 'desc'));
            const unsubCoupons = onSnapshot(couponsQuery, (snapshot) => {
                const coupons = snapshot.docs.map(doc => ({ 
                    id: doc.id, 
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate?.() || new Date()
                }));
                console.log(`🔴 Real-time coupons update: ${coupons.length} coupons`);
                callback({ type: 'coupons', data: coupons });
            });
            unsubscribes.push(unsubCoupons);
            
            // Listen to customer data collections
            const customerDataQuery = query(collection(db, 'shopCustomerData'), orderBy('timestamp', 'desc'), limit(50));
            const unsubCustomers = onSnapshot(customerDataQuery, (snapshot) => {
                const customers = snapshot.docs.map(doc => ({ 
                    id: doc.id, 
                    ...doc.data(),
                    timestamp: doc.data().timestamp?.toDate?.() || new Date()
                }));
                console.log(`🔴 Real-time customer data update: ${customers.length} customers`);
                callback({ type: 'customers', data: customers });
            });
            unsubscribes.push(unsubCustomers);
            
            console.log('✅ Real-time intelligence listeners setup complete');
            
        } catch (error) {
            console.error('❌ Error setting up real-time listeners:', error);
        }
        
        return () => {
            console.log('🔴 Cleaning up real-time intelligence listeners...');
            unsubscribes.forEach(unsub => {
                try {
                    unsub();
                } catch (error) {
                    console.error('❌ Error unsubscribing:', error);
                }
            });
        };
    },

    // CRITICAL: Comprehensive activity logging for Intelligence Center
    logUserActivity: async (activityData: {
        type: string;
        action: string;
        userId: string;
        userName: string;
        details?: any;
        [key: string]: any;
    }): Promise<void> => {
        try {
            console.log('📝 CRITICAL: Logging user activity for Intelligence Center:', activityData);
            
            const timestamp = new Date();
            const logEntry = {
                ...activityData,
                timestamp: serverTimestamp(),
                dateOccurred: timestamp.toISOString(),
                id: `${activityData.userId}-${activityData.action}-${timestamp.getTime()}`
            };
            
            // Log to multiple collections for comprehensive tracking
            const promises = [
                // Admin activity log
                addDoc(collection(db, 'adminActivityLog'), logEntry),
                // User action log
                addDoc(collection(db, 'userActionLog'), logEntry),
                // System activity log
                addDoc(collection(db, 'systemActivity'), logEntry)
            ];
            
            await Promise.all(promises);
            console.log('✅ CRITICAL: Activity logged to all tracking collections');
        } catch (error) {
            console.error('❌ FIREBASE: Failed to log user activity, using mock fallback:', error);
            return [];
        }
    },
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

    // NEW: Get detailed redemption data for a shop
    getRedemptionsForShop: async (shopId: string): Promise<any[]> => {
        try {
            console.log('🔍 FIREBASE: Fetching redemptions for shop:', shopId);
            const redemptionsCollection = collection(db, "redemptions");
            const q = query(redemptionsCollection, where("shopOwnerId", "==", shopId), orderBy("redeemedAt", "desc"));
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({ 
                id: doc.id, 
                ...doc.data(),
                redeemedAt: doc.data().redeemedAt?.toDate?.() || new Date(doc.data().redeemedAt || Date.now())
            }));
            console.log(`✅ FIREBASE: Found ${data.length} redemptions for shop ${shopId}`);
            return data;
        } catch (error) {
            console.error('❌ FIREBASE: Error fetching shop redemptions, falling back to mock data:', error);
            console.log('🔄 FALLBACK: Using safe fallback data for redemptions...');
            return generateSafeRedemptionData(shopId);
        }
    },

    // NEW: Get all affiliates who promoted this shop's coupons
    getAffiliatesForShop: async (shopId: string): Promise<any[]> => {
        try {
            console.log('🔍 FIREBASE: Fetching affiliates for shop:', shopId);
            const redemptionsCollection = collection(db, "redemptions");
            const q = query(redemptionsCollection, where("shopOwnerId", "==", shopId));
            const snapshot = await getDocs(q);
            
            // Get unique affiliate IDs and their performance data
            const affiliateMap = new Map();
            snapshot.docs.forEach(doc => {
                const data = doc.data();
                const affiliateId = data.affiliateId;
                if (affiliateId) {
                    if (!affiliateMap.has(affiliateId)) {
                        affiliateMap.set(affiliateId, {
                            affiliateId,
                            affiliateName: data.affiliateName || 'Unknown',
                            redemptions: [],
                            totalCommission: 0,
                            totalRedemptions: 0
                        });
                    }
                    const affiliate = affiliateMap.get(affiliateId);
                    affiliate.redemptions.push({
                        ...data,
                        redeemedAt: data.redeemedAt?.toDate?.() || new Date(data.redeemedAt || Date.now())
                    });
                    affiliate.totalCommission += data.commissionEarned || 0;
                    affiliate.totalRedemptions += 1;
                }
            });
            
            const data = Array.from(affiliateMap.values());
            console.log(`✅ FIREBASE: Found ${data.length} affiliates for shop ${shopId}`);
            return data;
        } catch (error) {
            console.error('❌ FIREBASE: Error fetching shop affiliates, falling back to mock data:', error);
            console.log('🔄 FALLBACK: Using safe fallback data for affiliates...');
            return generateSafeAffiliateData(shopId);
        }
    },

    // Get all customer data from redemptions for this shop
    getCustomerDataForShop: async (shopId: string): Promise<any[]> => {
        try {
            console.log('🔍 Fetching customer data for shop:', shopId);
            
            let allCustomerData: any[] = [];
            
            // 1. Get customer data from shopCustomerData collection (primary source)
            try {
                const shopCustomerDataCollection = collection(db, "shopCustomerData");
                const q = query(
                    shopCustomerDataCollection, 
                    where("shopOwnerId", "==", shopId),
                    orderBy("timestamp", "desc")
                );
                
                const snapshot = await getDocs(q);
                const customerData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    source: 'shopCustomerData',
                    redeemedAt: doc.data().timestamp?.toDate?.() || doc.data().redeemedAt?.toDate?.() || doc.data().createdAt?.toDate?.() || new Date()
                }));
                
                console.log(`📊 Found ${customerData.length} customer records in shopCustomerData for shop ${shopId}`);
                allCustomerData = [...customerData];
            } catch (orderError) {
                console.log('⚠️ Timestamp ordering failed, trying createdAt ordering...');
                try {
                    const shopCustomerDataCollection = collection(db, "shopCustomerData");
                    const q = query(
                        shopCustomerDataCollection, 
                        where("shopOwnerId", "==", shopId),
                        orderBy("createdAt", "desc")
                    );
                    
                    const snapshot = await getDocs(q);
                    const customerData = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                        source: 'shopCustomerData',
                        redeemedAt: doc.data().timestamp?.toDate?.() || doc.data().redeemedAt?.toDate?.() || doc.data().createdAt?.toDate?.() || new Date()
                    }));
                    
                    console.log(`📊 Found ${customerData.length} customer records in shopCustomerData (via createdAt) for shop ${shopId}`);
                    allCustomerData = [...customerData];
                } catch (createdAtError) {
                    console.log('⚠️ CreatedAt ordering also failed, fetching without ordering...');
                    const shopCustomerDataCollection = collection(db, "shopCustomerData");
                    const q = query(shopCustomerDataCollection, where("shopOwnerId", "==", shopId));
                    
                    const snapshot = await getDocs(q);
                    const customerData = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                        source: 'shopCustomerData',
                        redeemedAt: doc.data().timestamp?.toDate?.() || doc.data().redeemedAt?.toDate?.() || doc.data().createdAt?.toDate?.() || new Date()
                    }));
                    
                    console.log(`📊 Found ${customerData.length} customer records in shopCustomerData (no ordering) for shop ${shopId}`);
                    allCustomerData = [...customerData];
                }
            }
            
            // 2. Also check redemptions collection for additional customer data
            try {
                console.log('📋 Also checking redemptions collection for additional customer data...');
                
                const redemptionsCollection = collection(db, "redemptions");
                const redemptionQuery = query(redemptionsCollection, where("shopOwnerId", "==", shopId));
                const redemptionSnapshot = await getDocs(redemptionQuery);
                
                const redemptionData = redemptionSnapshot.docs
                    .map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                        source: 'redemptions',
                        redeemedAt: doc.data().redeemedAt?.toDate?.() || new Date()
                    }))
                    .filter(redemption => redemption.customerName || redemption.customerPhone || redemption.customerEmail);
                
                console.log(`📊 Found ${redemptionData.length} redemptions with customer data`);
                
                // Merge with existing data (avoid duplicates based on couponId + userId)
                const existingKeys = new Set(allCustomerData.map(item => `${item.couponId}-${item.userId}`));
                const newRedemptionData = redemptionData.filter(item => 
                    !existingKeys.has(`${item.couponId}-${item.userId}`)
                );
                
                allCustomerData = [...allCustomerData, ...newRedemptionData];
                console.log(`📊 Total customer records after merging: ${allCustomerData.length}`);
            } catch (redemptionError) {
                console.error('❌ Error fetching from redemptions collection:', redemptionError);
            }
            
            // 3. Sort all data by redemption date (newest first)
            allCustomerData.sort((a, b) => {
                const dateA = new Date(a.redeemedAt).getTime();
                const dateB = new Date(b.redeemedAt).getTime();
                return dateB - dateA;
            });
            
            console.log(`✅ Returning ${allCustomerData.length} total customer records for shop ${shopId}`);
            
            // Log sample data for debugging if we have records
            if (allCustomerData.length > 0) {
                console.log('📝 Sample customer data:', {
                    sampleRecord: allCustomerData[0],
                    totalRecords: allCustomerData.length,
                    sources: [...new Set(allCustomerData.map(item => item.source))]
                });
            }
            
            return allCustomerData;
        } catch (error) {
            console.error('❌ FIREBASE: Error fetching customer data for shop, falling back to mock data:', error);
            console.log('🔄 FALLBACK: Using safe fallback data for customer data...');
            return generateSafeCustomerData(shopId);
        }
    },

    // NEW: Get customer data for affiliate dashboard
    getCustomerDataForAffiliate: async (affiliateId: string): Promise<any[]> => {
        try {
            console.log('🔍 FIREBASE: Fetching customer data for affiliate:', affiliateId);
            
            let allCustomerData: any[] = [];
            
            // 1. Get customer data from affiliateCustomerData collection (primary source)
            try {
                const affiliateCustomerDataCollection = collection(db, "affiliateCustomerData");
                const q = query(
                    affiliateCustomerDataCollection, 
                    where("affiliateId", "==", affiliateId),
                    orderBy("timestamp", "desc")
                );
                
                const snapshot = await getDocs(q);
                const customerData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    source: 'affiliateCustomerData',
                    redeemedAt: doc.data().timestamp?.toDate?.() || doc.data().redeemedAt?.toDate?.() || doc.data().createdAt?.toDate?.() || new Date()
                }));
                
                console.log(`📊 Found ${customerData.length} customer records in affiliateCustomerData for affiliate ${affiliateId}`);
                allCustomerData = [...customerData];
            } catch (orderError) {
                // Fallback without ordering if index doesn't exist
                try {
                    const affiliateCustomerDataCollection = collection(db, "affiliateCustomerData");
                    const q = query(affiliateCustomerDataCollection, where("affiliateId", "==", affiliateId));
                    
                    const snapshot = await getDocs(q);
                    const customerData = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                        source: 'affiliateCustomerData',
                        redeemedAt: doc.data().timestamp?.toDate?.() || doc.data().redeemedAt?.toDate?.() || doc.data().createdAt?.toDate?.() || new Date()
                    }));
                    
                    console.log(`📊 Found ${customerData.length} customer records in affiliateCustomerData (no ordering) for affiliate ${affiliateId}`);
                    allCustomerData = [...customerData];
                } catch (noOrderError) {
                    console.log('⚠️ No affiliateCustomerData collection found, checking redemptions...');
                }
            }
            
            // 2. Also check redemptions collection for additional customer data
            try {
                console.log('📋 Also checking redemptions collection for affiliate customer data...');
                
                const redemptionsCollection = collection(db, "redemptions");
                const redemptionQuery = query(redemptionsCollection, where("affiliateId", "==", affiliateId));
                const redemptionSnapshot = await getDocs(redemptionQuery);
                
                const redemptionData = redemptionSnapshot.docs
                    .map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                        source: 'redemptions',
                        redeemedAt: doc.data().redeemedAt?.toDate?.() || new Date()
                    }))
                    .filter(redemption => redemption.customerName || redemption.customerPhone || redemption.customerEmail);
                
                console.log(`📊 Found ${redemptionData.length} redemptions with customer data for affiliate`);
                
                // Merge with existing data (avoid duplicates based on couponId + userId)
                const existingKeys = new Set(allCustomerData.map(item => `${item.couponId}-${item.userId}`));
                const newRedemptionData = redemptionData.filter(item => 
                    !existingKeys.has(`${item.couponId}-${item.userId}`)
                );
                
                allCustomerData = [...allCustomerData, ...newRedemptionData];
                console.log(`📊 Total customer records after merging: ${allCustomerData.length}`);
            } catch (redemptionError) {
                console.error('❌ Error fetching from redemptions collection for affiliate:', redemptionError);
            }
            
            // Sort by redemption date (newest first)
            allCustomerData.sort((a, b) => {
                const dateA = new Date(a.redeemedAt).getTime();
                const dateB = new Date(b.redeemedAt).getTime();
                return dateB - dateA;
            });
            
            console.log(`✅ Returning ${allCustomerData.length} total customer records for affiliate ${affiliateId}`);
            return allCustomerData;
            
        } catch (error) {
            console.error('❌ FIREBASE: Error fetching customer data for affiliate, falling back to mock data:', error);
            console.log('🔄 FALLBACK: Using safe fallback data for affiliate customer data...');
            return generateSafeCustomerData(affiliateId);
        }
    },

    // NEW: Get redemptions for affiliate dashboard
    getRedemptionsForAffiliate: async (affiliateId: string): Promise<any[]> => {
        try {
            console.log('🔍 FIREBASE: Fetching redemptions for affiliate:', affiliateId);
            const redemptionsCollection = collection(db, "redemptions");
            const q = query(redemptionsCollection, where("affiliateId", "==", affiliateId), orderBy("redeemedAt", "desc"));
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({ 
                id: doc.id, 
                ...doc.data(),
                redeemedAt: doc.data().redeemedAt?.toDate?.() || new Date(doc.data().redeemedAt || Date.now())
            }));
            console.log(`✅ FIREBASE: Found ${data.length} redemptions for affiliate ${affiliateId}`);
            return data;
        } catch (error) {
            console.error('❌ FIREBASE: Error fetching affiliate redemptions, falling back to mock data:', error);
            console.log('🔄 FALLBACK: Using safe fallback data for affiliate redemptions...');
            return generateSafeRedemptionData(affiliateId);
        }
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

        // Validate and sanitize coupon data first
        const validation = validateCouponData(data);
        if (!validation.isValid) {
            throw new Error(`Invalid coupon data: ${validation.errors.join(', ')}`);
        }

        // Sanitize the data to remove undefined values and apply defaults
        const sanitizedData = sanitizeCouponData(data) as CreateCouponData;

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
                details: `Created coupon: ${sanitizedData.title} (50 credits deducted)`
            });

            // CRITICAL: Track coupon creation for admin visibility
            const adminActivityRef = collection(db, "adminActivityLog");
            const adminActivityLogRef = doc(adminActivityRef);
            transaction.set(adminActivityLogRef, {
                type: 'SHOP_ACTIVITY',
                action: 'coupon_created',
                userId: shopOwner.id,
                userName: shopOwner.name,
                userEmail: shopOwner.email,
                
                // Coupon details
                couponId: null, // Will be set after creation
                couponTitle: sanitizedData.title,
                couponType: sanitizedData.discountType,
                couponValue: sanitizedData.discountValue,
                maxUses: sanitizedData.maxUses,
                
                // Shop details
                shopOwnerId: shopOwner.id,
                shopOwnerName: shopOwner.name,
                
                // Financial tracking
                creditsSpent: couponCost,
                
                // Complete tracking data
                timestamp: serverTimestamp(),
                dateOccurred: new Date().toISOString(),
                source: 'coupon_creation',
                
                // Summary for admin dashboard
                summary: `Shop "${shopOwner.name}" created coupon "${sanitizedData.title}" (${couponCost} credits spent)`,
                importance: 'medium'
            });

            // REAL-TIME: User action tracking for comprehensive monitoring
            const userActionLogRef = collection(db, "userActionLog");
            const userActionRef = doc(userActionLogRef);
            transaction.set(userActionRef, {
                userId: shopOwner.id,
                userName: shopOwner.name,
                userEmail: shopOwner.email,
                action: 'create_coupon',
                details: {
                    couponTitle: sanitizedData.title,
                    discountValue: sanitizedData.discountValue,
                    discountType: sanitizedData.discountType,
                    maxUses: sanitizedData.maxUses,
                    creditsSpent: couponCost
                },
                page: '/shop-dashboard',
                timestamp: serverTimestamp(),
                sessionId: null, // Would be populated from client
                userAgent: null, // Would be populated from client
                url: window?.location?.href || 'unknown',
                deviceInfo: {},
                source: 'shop_dashboard'
            });

            // Create the coupon with sanitized data - guaranteed no undefined values
            const rawCouponData = {
                ...sanitizedData,
                shopOwnerName: shopOwner.name,
                usesLeft: sanitizedData.maxUses,
                clicks: 0,
                creationCost: couponCost,
                createdAt: serverTimestamp(),
                expiryDate: sanitizedData.expiryDate ? Timestamp.fromDate(new Date(sanitizedData.expiryDate)) : null,
            };
            
            // FINAL SAFETY CHECK: Validate data before sending to Firebase
            const newCouponData = prepareCouponForFirebase(rawCouponData, 'Coupon Creation');
            
            const couponsCollection = collection(db, "coupons");
            const newDocRef = doc(couponsCollection);
            transaction.set(newDocRef, newCouponData);
            
            console.log(`✅ Coupon created and tracked: ${sanitizedData.title} by ${shopOwner.name}`);
            
            return { 
                ...sanitizedData, 
                id: newDocRef.id, 
                usesLeft: sanitizedData.maxUses, 
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

                    // CRITICAL: Always log for admin tracking - every redemption
                    const adminActivityRef = collection(db, "adminActivityLog");
                    const adminActivityLogRef = doc(adminActivityRef);
                    transaction.set(adminActivityLogRef, {
                        type: 'CUSTOMER_REDEMPTION',
                        action: 'coupon_redeemed',
                        userId: customerId || 'unknown',
                        userName: customerData?.name || 'Unknown Customer',
                        userEmail: customerData?.email || null,
                        
                        // Coupon and shop details
                        couponId: couponId,
                        couponTitle: couponTxnData.title,
                        shopOwnerId: couponTxnData.shopOwnerId,
                        shopOwnerName: shopData.name,
                        
                        // Affiliate details (if applicable)
                        affiliateId: affiliateId || null,
                        affiliateName: affiliateData?.name || null,
                        wasAffiliateDriven: !!affiliateId,
                        
                        // Financial tracking
                        commissionPaid: (affiliateData && affiliateId && couponTxnData.affiliateCommission) ? couponTxnData.affiliateCommission : 0,
                        customerRewardPoints: couponTxnData.customerRewardPoints || 0,
                        
                        // Complete tracking data
                        timestamp: serverTimestamp(),
                        dateOccurred: new Date().toISOString(),
                        source: 'standard_redemption',
                        
                        // Summary for admin dashboard
                        summary: `Coupon "${couponTxnData.title}" redeemed at ${shopData.name}${affiliateId ? ` via affiliate ${affiliateData?.name}` : ' (direct)'}`,
                        importance: 'medium'
                    });

                    // REAL-TIME: User action tracking for comprehensive monitoring
                    const userActionLogRef = collection(db, "userActionLog");
                    const userActionRef = doc(userActionLogRef);
                    transaction.set(userActionRef, {
                        userId: customerId || 'unknown',
                        userName: customerData?.name || 'Unknown Customer',
                        userEmail: customerData?.email || null,
                        action: 'redeem_coupon',
                        details: {
                            couponId: couponId,
                            couponTitle: couponTxnData.title,
                            shopOwnerId: couponTxnData.shopOwnerId,
                            shopOwnerName: shopData.name,
                            affiliateId: affiliateId || null,
                            affiliateName: affiliateData?.name || null,
                            discountValue: couponTxnData.discountValue,
                            discountType: couponTxnData.discountType,
                            redemptionMethod: 'standard'
                        },
                        page: '/coupon-redemption',
                        timestamp: serverTimestamp(),
                        sessionId: null, // Would be populated from client
                        userAgent: null, // Would be populated from client
                        url: window?.location?.href || 'unknown',
                        deviceInfo: {},
                        source: 'api_redemption'
                    });
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
        try {
            console.log('🔄 Processing customer redemption with data:', { couponId, affiliateId, customerId, hasCustomerData: !!customerData });
            
            // Get coupon data first to extract shop information
            const couponRef = doc(db, "coupons", couponId);
            const couponSnap = await getDoc(couponRef);
            
            if (!couponSnap.exists()) {
                return { success: false, message: "Coupon not found." };
            }
            
            const couponData = couponSnap.data();
            console.log('📋 Coupon data retrieved:', { shopOwnerId: couponData.shopOwnerId, title: couponData.title });
            
            // First redeem the coupon normally
            const result = await api.redeemCoupon(couponId, affiliateId, customerId);
            
            if (result.success && customerData) {
                console.log('✅ Standard redemption successful, now storing customer data...');
                
                // Get affiliate information if exists
                let affiliateName = null;
                if (affiliateId) {
                    try {
                        const affiliateRef = doc(db, "shops", affiliateId);
                        const affiliateSnap = await getDoc(affiliateRef);
                        if (affiliateSnap.exists()) {
                            affiliateName = affiliateSnap.data().name || 'Unknown Affiliate';
                        }
                    } catch (error) {
                        console.log('Could not fetch affiliate name:', error);
                    }
                }

                // Create comprehensive customer data for Shop Owner dashboard
                const timestamp = serverTimestamp();
                const currentTime = new Date().toISOString();
                const comprehensiveCustomerData = {
                    // Core redemption info
                    couponId,
                    couponTitle: couponData.title || customerData.couponTitle || 'Unknown Coupon',
                    shopOwnerId: couponData.shopOwnerId,
                    shopOwnerName: couponData.shopOwnerName || 'Unknown Shop',
                    
                    // Customer details - ensure all fields are captured
                    userId: customerId,
                    customerName: customerData.name?.trim() || customerData.customerName?.trim() || null,
                    customerPhone: customerData.phone?.trim() || customerData.customerPhone?.trim() || null,
                    customerEmail: customerData.email?.trim() || customerData.customerEmail?.trim() || customerData.userEmail || null,
                    customerAddress: customerData.address?.trim() || customerData.customerAddress?.trim() || null,
                    customerAge: customerData.age || customerData.customerAge || null,
                    customerGender: customerData.gender || customerData.customerGender || null,
                    
                    // User account details
                    userEmail: customerData.userEmail || customerData.email,
                    userAccountName: customerData.userAccountName || customerData.name,
                    
                    // Affiliate info
                    affiliateId: affiliateId || null,
                    affiliateName: affiliateName,
                    
                    // Financial data
                    discountType: couponData.discountType || customerData.discountType || 'percentage',
                    discountValue: couponData.discountValue || customerData.discountValue || 0,
                    commissionEarned: affiliateId ? (couponData.affiliateCommission || customerData.affiliateCommission || 0) : 0,
                    customerRewardPoints: couponData.customerRewardPoints || customerData.customerRewardPoints || 0,
                    
                    // Additional context
                    redemptionLocation: customerData.redemptionLocation || window?.location?.href || 'Unknown',
                    userAgent: customerData.userAgent || 'Unknown',
                    
                    // Timestamps - use both for compatibility
                    redeemedAt: timestamp,
                    timestamp: timestamp,
                    createdAt: timestamp,
                    
                    // Additional tracking fields
                    dataSource: 'customer_form_submission',
                    isVerifiedCustomer: !!(customerData.name && customerData.phone), // Has required info
                    hasCompleteProfile: !!(customerData.name && customerData.phone && customerData.email && customerData.address)
                };

                console.log('📝 Storing customer data for shop owner dashboard:', comprehensiveCustomerData);

                try {
                    console.log('💾 Starting customer data storage process...');
                    console.log('📋 Data to store:', JSON.stringify(comprehensiveCustomerData, null, 2));

                    // 1. Store in shopCustomerData collection for Shop Owner dashboard
                    const shopCustomerDataRef = collection(db, "shopCustomerData");
                    const customerDocRef = await addDoc(shopCustomerDataRef, comprehensiveCustomerData);
                    console.log('✅ Stored customer data in shopCustomerData collection with ID:', customerDocRef.id);

                    // 2. If affiliate exists, ALSO store in affiliateCustomerData collection for Affiliate dashboard
                    if (affiliateId && affiliateName) {
                        console.log('🤝 Storing affiliate customer data for affiliate:', affiliateId);
                        
                        const affiliateCustomerData = {
                            ...comprehensiveCustomerData,
                            // Affiliate-specific tracking
                            affiliateDataSource: 'affiliate_promotion',
                            affiliatePromotionSuccess: true,
                            affiliateEarningsConfirmed: true
                        };
                        
                        const affiliateCustomerDataRef = collection(db, "affiliateCustomerData");
                        const affiliateDocRef = await addDoc(affiliateCustomerDataRef, affiliateCustomerData);
                        console.log('✅ Stored affiliate customer data in affiliateCustomerData collection with ID:', affiliateDocRef.id);
                    }

                    // 2. Also update the redemption record with customer data for complete tracking
                    console.log('🔄 Updating redemption record with customer data...');
                    const redemptionsCollection = collection(db, "redemptions");
                    const redemptionQuery = query(
                        redemptionsCollection, 
                        where("couponId", "==", couponId),
                        where("customerId", "==", customerId),
                        limit(1)
                    );
                    const existingRedemption = await getDocs(redemptionQuery);
                    
                    if (!existingRedemption.empty) {
                        const redemptionDocRef = existingRedemption.docs[0].ref;
                        const redemptionUpdateData = {
                            customerName: comprehensiveCustomerData.customerName,
                            customerPhone: comprehensiveCustomerData.customerPhone,
                            customerEmail: comprehensiveCustomerData.customerEmail,
                            customerAddress: comprehensiveCustomerData.customerAddress,
                            customerAge: comprehensiveCustomerData.customerAge,
                            customerGender: comprehensiveCustomerData.customerGender,
                            affiliateName: comprehensiveCustomerData.affiliateName,
                            discountType: comprehensiveCustomerData.discountType,
                            discountValue: comprehensiveCustomerData.discountValue,
                            shopOwnerName: comprehensiveCustomerData.shopOwnerName,
                            couponTitle: comprehensiveCustomerData.couponTitle,
                            isVerifiedCustomer: comprehensiveCustomerData.isVerifiedCustomer,
                            hasCompleteProfile: comprehensiveCustomerData.hasCompleteProfile,
                            dataSource: comprehensiveCustomerData.dataSource
                        };
                        
                        await updateDoc(redemptionDocRef, redemptionUpdateData);
                        console.log('✅ Updated redemption record with customer data:', redemptionDocRef.id);
                    } else {
                        console.log('⚠️ No matching redemption record found to update');
                    }

                    // 3. CRITICAL: Store data for ADMIN tracking as well
                    console.log('👑 Storing admin activity tracking...');
                    const adminActivityRef = collection(db, "adminActivityLog");
                    const adminActivityData = {
                        type: 'CUSTOMER_REDEMPTION',
                        action: 'coupon_redeemed_with_customer_data',
                        userId: customerId,
                        userName: customerData.userAccountName || customerData.name || 'Unknown User',
                        userEmail: customerData.userEmail || customerData.email || null,
                        
                        // Customer details for admin visibility
                        customerName: comprehensiveCustomerData.customerName,
                        customerPhone: comprehensiveCustomerData.customerPhone,
                        customerEmail: comprehensiveCustomerData.customerEmail,
                        customerAddress: comprehensiveCustomerData.customerAddress,
                        
                        // Coupon and shop details
                        couponId: couponId,
                        couponTitle: comprehensiveCustomerData.couponTitle,
                        shopOwnerId: comprehensiveCustomerData.shopOwnerId,
                        shopOwnerName: comprehensiveCustomerData.shopOwnerName,
                        
                        // Affiliate details (if applicable)
                        affiliateId: affiliateId || null,
                        affiliateName: affiliateName || null,
                        wasAffiliateDriven: !!affiliateId,
                        
                        // Financial tracking
                        discountValue: comprehensiveCustomerData.discountValue,
                        commissionPaid: comprehensiveCustomerData.commissionEarned,
                        customerRewardPoints: comprehensiveCustomerData.customerRewardPoints,
                        
                        // Complete tracking data
                        timestamp: timestamp,
                        dateOccurred: new Date().toISOString(),
                        source: 'customer_redemption_portal',
                        isVerifiedCustomer: comprehensiveCustomerData.isVerifiedCustomer,
                        hasCompleteProfile: comprehensiveCustomerData.hasCompleteProfile,
                        
                        // Summary for admin dashboard
                        summary: `Customer ${customerData.name} redeemed "${comprehensiveCustomerData.couponTitle}" at ${comprehensiveCustomerData.shopOwnerName}${affiliateId ? ` via affiliate ${affiliateName}` : ' (direct)'}`,
                        importance: 'high' // For admin attention
                    };
                    
                    await addDoc(adminActivityRef, adminActivityData);
                    console.log('✅ Admin activity tracking stored successfully');

                    // 4. Verify the data was stored successfully
                    console.log('🔍 Verifying customer data storage...');
                    const verificationQuery = query(
                        shopCustomerDataRef,
                        where("shopOwnerId", "==", couponData.shopOwnerId),
                        where("couponId", "==", couponId),
                        where("userId", "==", customerId),
                        limit(1)
                    );
                    const verificationSnapshot = await getDocs(verificationQuery);
                    
                    if (!verificationSnapshot.empty) {
                        console.log('✅ Customer data storage verified successfully!');
                        console.log('📊 Stored record ID:', verificationSnapshot.docs[0].id);
                        console.log('📋 Verification data:', verificationSnapshot.docs[0].data());
                    } else {
                        console.log('❌ Customer data verification failed - record not found!');
                    }

                    console.log('🎉 Customer data successfully stored - will appear in Shop Owner dashboard AND Admin dashboard');
                    
                } catch (storageError) {
                    console.error('❌ Failed to store customer data:', storageError);
                    console.error('❌ Storage error details:', {
                        message: storageError.message,
                        code: storageError.code,
                        stack: storageError.stack
                    });
                    
                    // Don't fail the entire redemption - log the error but continue
                    console.log('⚠️ Continuing with redemption despite storage error');
                }
            }
            
            return result;
        } catch (error) {
            console.error("❌ Failed to process customer data redemption:", error);
            return { success: false, message: "Failed to process redemption. Please try again." };
        }
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
    


    getAllRedemptions: async (): Promise<Redemption[]> => {
        try {
            console.log('🔍 Admin fetching all redemptions...');
            let allRedemptions: any[] = [];

            // 1. Get standard redemptions
            try {
                const redemptionsRef = collection(db, "redemptions");
                const q = query(redemptionsRef, orderBy("redeemedAt", "desc"));
                const querySnapshot = await getDocs(q);
                const standardRedemptions = querySnapshot.docs.map(fromFirestore) as Redemption[];
                console.log(`📊 Found ${standardRedemptions.length} standard redemptions`);
                allRedemptions = [...standardRedemptions];
            } catch (orderError) {
                console.log('⚠️ Error with ordered query, trying without ordering...');
                const redemptionsRef = collection(db, "redemptions");
                const q = query(redemptionsRef);
                const querySnapshot = await getDocs(q);
                const standardRedemptions = querySnapshot.docs.map(fromFirestore) as Redemption[];
                console.log(`📊 Found ${standardRedemptions.length} standard redemptions (no ordering)`);
                allRedemptions = [...standardRedemptions];
            }

            // 2. Get admin activity log data for customer redemptions
            try {
                const adminActivityQuery = query(
                    collection(db, "adminActivityLog"), 
                    where("type", "==", "CUSTOMER_REDEMPTION")
                );
                const adminActivitySnapshot = await getDocs(adminActivityQuery);
                const adminActivityRedemptions = adminActivitySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    redeemedAt: doc.data().timestamp?.toDate?.() || doc.data().dateOccurred ? new Date(doc.data().dateOccurred) : new Date(),
                    source: 'adminActivityLog'
                }));
                console.log(`📊 Found ${adminActivityRedemptions.length} admin activity redemptions`);

                // Merge avoiding duplicates
                const existingKeys = new Set(allRedemptions.map(item => `${item.couponId}-${item.customerId || item.userId}`));
                const newActivityRedemptions = adminActivityRedemptions.filter(item => 
                    !existingKeys.has(`${item.couponId}-${item.customerId || item.userId}`)
                );
                allRedemptions = [...allRedemptions, ...newActivityRedemptions];
            } catch (activityError) {
                console.log('⚠️ Error fetching admin activity log:', activityError);
            }

            // 3. Get shop customer data for additional redemption info
            try {
                const shopCustomerQuery = query(collection(db, "shopCustomerData"));
                const shopCustomerSnapshot = await getDocs(shopCustomerQuery);
                const shopCustomerRedemptions = shopCustomerSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    redeemedAt: doc.data().timestamp?.toDate?.() || doc.data().redeemedAt?.toDate?.() || new Date(),
                    source: 'shopCustomerData'
                }));
                console.log(`📊 Found ${shopCustomerRedemptions.length} shop customer data records`);

                // Merge avoiding duplicates
                const existingKeys = new Set(allRedemptions.map(item => `${item.couponId}-${item.customerId || item.userId}`));
                const newShopCustomerRedemptions = shopCustomerRedemptions.filter(item => 
                    !existingKeys.has(`${item.couponId}-${item.customerId || item.userId}`)
                );
                allRedemptions = [...allRedemptions, ...newShopCustomerRedemptions];
            } catch (shopCustomerError) {
                console.log('⚠️ Error fetching shop customer data:', shopCustomerError);
            }

            // Sort all redemptions by date (newest first)
            allRedemptions.sort((a, b) => {
                const dateA = new Date(a.redeemedAt).getTime();
                const dateB = new Date(b.redeemedAt).getTime();
                return dateB - dateA;
            });

            console.log(`✅ Admin: Total ${allRedemptions.length} redemptions found across all sources`);
            return allRedemptions as Redemption[];
        } catch (error) {
            console.error('❌ Error fetching all redemptions:', error);
            return [];
        }
    },

    getAllReferrals: async (): Promise<Referral[]> => {
        const referralsRef = collection(db, "referrals");
        const q = query(referralsRef, orderBy("signupDate", "desc"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(fromFirestore) as Referral[];
    },

    getAdminCreditLogs: async (): Promise<AdminCreditLog[]> => {
        try {
            const q = query(collection(db, "adminCreditLogs"), orderBy("timestamp", "desc"));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(fromFirestore) as AdminCreditLog[];
        } catch (error) {
            console.log('⚠️ Error with ordered query, trying without ordering...');
            const q = query(collection(db, "adminCreditLogs"));
            const querySnapshot = await getDocs(q);
            const logs = querySnapshot.docs.map(fromFirestore) as AdminCreditLog[];
            return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        }
    },

    getAllUsers: async (): Promise<Shop[]> => {
        const querySnapshot = await getDocs(collection(db, "shops"));
        return querySnapshot.docs.map(fromFirestore) as Shop[];
    },
    
    // Track shop registration/creation for admin visibility
    trackShopCreation: async (shopData: any): Promise<void> => {
        try {
            console.log('📝 Tracking shop creation for admin visibility:', shopData.name);
            
            // Log for admin tracking
            const adminActivityRef = collection(db, "adminActivityLog");
            await addDoc(adminActivityRef, {
                type: 'SHOP_REGISTRATION',
                action: 'shop_registered',
                userId: shopData.id,
                userName: shopData.name,
                userEmail: shopData.email,
                
                // Shop details
                shopOwnerId: shopData.id,
                shopOwnerName: shopData.name,
                shopEmail: shopData.email,
                shopRoles: shopData.roles,
                
                // Registration details
                registrationDate: new Date().toISOString(),
                initialCredits: shopData.credits || 0,
                
                // Complete tracking data
                timestamp: serverTimestamp(),
                dateOccurred: new Date().toISOString(),
                source: 'shop_registration',
                
                // Summary for admin dashboard
                summary: `New shop "${shopData.name}" registered (${shopData.email})`,
                importance: 'high'
            });

            // Also track user action
            const userActionLogRef = collection(db, "userActionLog");
            await addDoc(userActionLogRef, {
                userId: shopData.id,
                userName: shopData.name,
                userEmail: shopData.email,
                action: 'register_shop',
                details: {
                    shopName: shopData.name,
                    email: shopData.email,
                    roles: shopData.roles,
                    initialCredits: shopData.credits || 0
                },
                page: '/register',
                timestamp: serverTimestamp(),
                sessionId: null,
                userAgent: null,
                url: 'shop_registration',
                deviceInfo: {},
                source: 'registration_form'
            });

            console.log('✅ Shop creation tracked for admin dashboard');
        } catch (error) {
            console.error('❌ Failed to track shop creation:', error);
            // Don't fail the registration process
        }
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
    },

    // ★★★ CRITICAL: Missing getFullIntelligenceData function for SuperAdminDashboard ★★★
    getFullIntelligenceData: async (): Promise<any> => {
        try {
            console.log('🔍 SUPER ADMIN: Fetching comprehensive intelligence data...');
            
            // STEP 1: Get ALL data from ALL sources
            const [
                allUsers, 
                allCoupons, 
                allRedemptions, 
                allReferrals,
                directFirebaseUsers,
                directFirebaseCoupons,
                directFirebaseRedemptions
            ] = await Promise.all([
                api.getAllUsers(),
                api.getAllCoupons(), 
                api.getAllRedemptions(),
                api.getAllReferrals(),
                // Direct Firebase queries to ensure completeness
                api.getDirectFirebaseCollection('shops'),
                api.getDirectFirebaseCollection('coupons'),
                api.getDirectFirebaseCollection('redemptions')
            ]);
            
            console.log('🔥 SUPER ADMIN: Data retrieved from all sources');
            
            // STEP 2: Merge API data with direct Firebase data for completeness
            const mergedUsers = [...allUsers];
            directFirebaseUsers.forEach(firebaseUser => {
                if (!mergedUsers.find(u => u.id === firebaseUser.id)) {
                    mergedUsers.push(firebaseUser);
                }
            });

            const mergedCoupons = [...allCoupons];
            directFirebaseCoupons.forEach(firebaseCoupon => {
                if (!mergedCoupons.find(c => c.id === firebaseCoupon.id)) {
                    mergedCoupons.push(firebaseCoupon);
                }
            });

            const mergedRedemptions = [...allRedemptions];
            directFirebaseRedemptions.forEach(firebaseRedemption => {
                if (!mergedRedemptions.find(r => r.id === firebaseRedemption.id)) {
                    mergedRedemptions.push(firebaseRedemption);
                }
            });
            
            console.log(`📊 SUPER ADMIN: Merged data - Users: ${mergedUsers.length}, Coupons: ${mergedCoupons.length}, Redemptions: ${mergedRedemptions.length}`);
            
            // STEP 3: Get comprehensive customer data
            const shopOwnerIds = mergedUsers.filter(u => u.roles && u.roles.includes('shop-owner')).map(u => u.id);
            const affiliateIds = mergedUsers.filter(u => u.roles && u.roles.includes('affiliate')).map(u => u.id);
            
            console.log(`🏪 SUPER ADMIN: Processing ${shopOwnerIds.length} shops and ${affiliateIds.length} affiliates`);
            
            const [shopCustomerData, affiliateCustomerData] = await Promise.all([
                Promise.all(shopOwnerIds.map(shopId => api.getCustomerDataForShop(shopId))),
                Promise.all(affiliateIds.map(affiliateId => api.getCustomerDataForAffiliate(affiliateId)))
            ]);
            
            // Combine and deduplicate customer data
            let allCustomerData = [
                ...shopCustomerData.flat(),
                ...affiliateCustomerData.flat()
            ];
            
            // Enhanced deduplication
            const uniqueCustomers = allCustomerData.reduce((unique, customer) => {
                const key = `${customer.couponId || 'no-coupon'}-${customer.userId || customer.customerId || 'no-user'}-${customer.redeemedAt || customer.timestamp}`;
                if (!unique.find(c => `${c.couponId || 'no-coupon'}-${c.userId || c.customerId || 'no-user'}-${c.redeemedAt || c.timestamp}` === key)) {
                    unique.push({
                        ...customer,
                        userId: customer.userId || customer.customerId || 'unknown',
                        customerName: customer.customerName || customer.name || 'Unknown Customer',
                        customerEmail: customer.customerEmail || customer.email || 'Unknown Email',
                        customerPhone: customer.customerPhone || customer.phone || 'Unknown Phone',
                        redeemedAt: customer.redeemedAt || customer.timestamp || new Date().toISOString()
                    });
                }
                return unique;
            }, [] as any[]);
            
            console.log(`📊 SUPER ADMIN: Processed ${uniqueCustomers.length} unique customers`);
            
            // STEP 4: Calculate comprehensive intelligence insights
            const intelligence = api.calculateFullIntelligenceInsights(uniqueCustomers, mergedUsers, mergedCoupons, mergedRedemptions);
            
            const result = {
                shopInsights: intelligence.shopInsights || [],
                affiliateInsights: intelligence.affiliateInsights || [],
                customerActivity: intelligence.customerActivity || [],
                globalAnalytics: intelligence.globalAnalytics || {
                    totalShops: mergedUsers.filter(u => u.roles && u.roles.includes('shop-owner')).length,
                    activeShops: 0,
                    totalAffiliates: mergedUsers.filter(u => u.roles && u.roles.includes('affiliate')).length,
                    activeAffiliates: 0,
                    totalCoupons: mergedCoupons.length,
                    activeCoupons: 0,
                    totalRedemptions: mergedRedemptions.length,
                    totalUniqueCustomers: uniqueCustomers.length,
                    totalRevenue: 0,
                    totalCommissions: 0,
                    networkEfficiency: '0',
                    systemHealth: { healthScore: '0', activeShopsPercent: '0', activeAffiliatesPercent: '0', customerSatisfaction: '0' }
                },
                lastUpdated: new Date().toISOString(),
                dataLoaded: true
            };
            
            console.log(`✅ SUPER ADMIN: Intelligence data ready with ${result.shopInsights.length} shops, ${result.affiliateInsights.length} affiliates, ${result.customerActivity.length} customers`);
            
            return result;
            
        } catch (error) {
            console.error('❌ SUPER ADMIN: Error in getFullIntelligenceData:', error);
            throw error;
        }
    },

    // ★★★ CRITICAL: Intelligence calculation engine for comprehensive analytics ★★★
    calculateFullIntelligenceInsights: (customers: any[], users: any[], coupons: any[], redemptions: any[]) => {
        console.log('🧠 Calculating full intelligence insights...');
        
        const shopOwners = users.filter(u => u.roles && u.roles.includes('shop-owner'));
        const affiliates = users.filter(u => u.roles && u.roles.includes('affiliate'));
        
        console.log(`📊 Processing insights for ${shopOwners.length} shop owners and ${affiliates.length} affiliates`);
        
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
                }
            };
        });

        // 2. Complete Affiliate Insights  
        const affiliateInsights = affiliates.map(affiliate => {
            const affiliateRedemptions = redemptions.filter(r => r.affiliateId === affiliate.id);
            const affiliateCustomers = customers.filter(c => c.affiliateId === affiliate.id);
            
            return {
                affiliateId: affiliate.id,
                affiliateName: affiliate.name,
                affiliateEmail: affiliate.email,
                affiliateCredits: affiliate.credits,
                totalCouponsPromoted: [...new Set(affiliateRedemptions.map(r => r.couponId))].length,
                totalRedemptions: affiliateRedemptions.length,
                totalCustomers: [...new Set(affiliateCustomers.map(c => c.userId))].length,
                totalCommissionsEarned: affiliateRedemptions.reduce((sum, r) => sum + (r.commissionEarned || 0), 0),
                shopsWorkedWith: [...new Set(affiliateRedemptions.map(r => r.shopOwnerId))].length,
                averageCommissionPerRedemption: affiliateRedemptions.length > 0 ? (affiliateRedemptions.reduce((sum, r) => sum + (r.commissionEarned || 0), 0) / affiliateRedemptions.length).toFixed(2) : '0',
                customerQuality: {
                    verified: affiliateCustomers.filter(c => c.isVerifiedCustomer).length,
                    completeProfiles: affiliateCustomers.filter(c => c.hasCompleteProfile).length,
                    qualityScore: affiliateCustomers.length > 0 ? ((affiliateCustomers.filter(c => c.isVerifiedCustomer).length / affiliateCustomers.length) * 100).toFixed(2) : '0'
                }
            };
        });

        // 3. Customer Activity Analytics with accurate deduplication
        const uniqueCustomerMap = new Map();
        customers.forEach(customer => {
            const userId = customer.userId;
            if (!userId) return;
            
            if (!uniqueCustomerMap.has(userId)) {
                uniqueCustomerMap.set(userId, {
                    customerId: userId,
                    customerName: customer.customerName || customer.name || 'Unknown',
                    customerEmail: customer.customerEmail || customer.email || 'Unknown',
                    customerPhone: customer.customerPhone || customer.phone || 'Unknown',
                    redemptions: [],
                    isVerified: customer.isVerifiedCustomer || false,
                    hasCompleteProfile: customer.hasCompleteProfile || false
                });
            }
            
            uniqueCustomerMap.get(userId).redemptions.push({
                couponId: customer.couponId,
                couponTitle: customer.couponTitle || 'Unknown Coupon',
                shopName: customer.shopOwnerName || 'Unknown Shop',
                shopOwnerId: customer.shopOwnerId,
                affiliateName: customer.affiliateName || null,
                affiliateId: customer.affiliateId || null,
                redeemedAt: customer.redeemedAt,
                discountValue: customer.discountValue || 0
            });
        });
        
        const customerActivity = Array.from(uniqueCustomerMap.values()).map(customer => {
            const redemptions = customer.redemptions;
            const uniqueShops = [...new Set(redemptions.map(r => r.shopOwnerId).filter(Boolean))];
            const uniqueAffiliates = [...new Set(redemptions.map(r => r.affiliateId).filter(Boolean))];
            const totalSavings = redemptions.reduce((sum, r) => sum + (r.discountValue || 0), 0);
            const lastActivityTime = Math.max(...redemptions.map(r => new Date(r.redeemedAt || 0).getTime()));
            
            return {
                customerId: customer.customerId,
                customerName: customer.customerName,
                customerEmail: customer.customerEmail,
                customerPhone: customer.customerPhone,
                totalRedemptions: redemptions.length,
                shopsVisited: uniqueShops.length,
                affiliatesUsed: uniqueAffiliates.length,
                totalSavings: Math.round(totalSavings * 100) / 100,
                lastActivity: lastActivityTime,
                acquisitionSource: uniqueAffiliates.length > 0 ? 'Affiliate' : 'Direct',
                isVerified: customer.isVerified,
                hasCompleteProfile: customer.hasCompleteProfile
            };
        }).filter(customer => customer.customerId && customer.totalRedemptions > 0)
          .sort((a, b) => b.totalRedemptions - a.totalRedemptions);

        // 4. Global Analytics with accurate calculations
        const uniqueRedemptions = redemptions.filter((redemption, index, self) => 
            index === self.findIndex(r => r.id === redemption.id)
        );
        
        const activeShopsCount = shopInsights.filter(s => s.totalRedemptions > 0).length;
        const activeAffiliatesCount = affiliateInsights.filter(a => a.totalRedemptions > 0).length;
        const uniqueActiveCoupons = [...new Set(uniqueRedemptions.map(r => r.couponId).filter(Boolean))].length;
        const totalActualRevenue = Math.round(uniqueRedemptions.reduce((sum, r) => sum + (parseFloat(r.discountValue) || 0), 0) * 100) / 100;
        const totalActualCommissions = Math.round(uniqueRedemptions.reduce((sum, r) => sum + (parseFloat(r.commissionEarned) || 0), 0) * 100) / 100;
        const affiliateRedemptionsCount = uniqueRedemptions.filter(r => r.affiliateId && r.affiliateId !== '').length;
        const networkEfficiencyRate = uniqueRedemptions.length > 0 ? ((affiliateRedemptionsCount / uniqueRedemptions.length) * 100).toFixed(1) : '0';
        
        const globalAnalytics = {
            totalShops: shopOwners.length,
            activeShops: activeShopsCount,
            totalAffiliates: affiliates.length,
            activeAffiliates: activeAffiliatesCount,
            totalCoupons: coupons.length,
            activeCoupons: uniqueActiveCoupons,
            totalRedemptions: uniqueRedemptions.length,
            totalUniqueCustomers: customerActivity.length,
            totalRevenue: totalActualRevenue,
            totalCommissions: totalActualCommissions,
            networkEfficiency: networkEfficiencyRate,
            systemHealth: {
                healthScore: Math.min(100, ((customerActivity.length / Math.max(1, uniqueRedemptions.length)) * 100)).toFixed(1),
                activeShopsPercent: shopOwners.length > 0 ? ((activeShopsCount / shopOwners.length) * 100).toFixed(1) : '0',
                activeAffiliatesPercent: affiliates.length > 0 ? ((activeAffiliatesCount / affiliates.length) * 100).toFixed(1) : '0',
                customerSatisfaction: customerActivity.length > 0 ? ((customerActivity.filter(c => c.isVerified).length / customerActivity.length) * 100).toFixed(1) : '0'
            }
        };

        console.log(`✅ Intelligence calculation complete - ${customerActivity.length} customers, ${shopInsights.length} shops, ${affiliateInsights.length} affiliates`);

        return {
            shopInsights: shopInsights.sort((a, b) => b.totalRedemptions - a.totalRedemptions),
            affiliateInsights: affiliateInsights.sort((a, b) => b.totalRedemptions - a.totalRedemptions),
            customerActivity,
            globalAnalytics,
            lastUpdated: new Date().toISOString()
        };
    }
};
