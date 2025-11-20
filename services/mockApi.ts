// 🔧 CRITICAL: Mock API implementations for affiliate and shop owner data visibility
// These methods are essential for the Data Intelligence Center and dashboard functionality

import { Coupon, Redemption, Shop, Referral, AdminCreditLog, CreditRequest, CreditKey } from '../types';

// Generate realistic mock data for comprehensive testing
const generateMockRedemptions = (shopId: string, count: number = 10): any[] => {
    const mockRedemptions = [];
    const now = new Date();
    
    for (let i = 0; i < count; i++) {
        const hoursAgo = Math.floor(Math.random() * 72); // Last 3 days
        const redemptionDate = new Date(now.getTime() - (hoursAgo * 60 * 60 * 1000));
        
        mockRedemptions.push({
            id: `redemption_${shopId}_${i}`,
            couponId: `coupon_${shopId}_${Math.floor(Math.random() * 5)}`,
            couponTitle: `Mock Coupon ${i + 1}`,
            shopOwnerId: shopId,
            shopOwnerName: `Shop Owner ${shopId.slice(-4)}`,
            customerId: `customer_${Math.random().toString(36).substr(2, 9)}`,
            customerName: `Customer ${['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'][Math.floor(Math.random() * 5)]} ${['Smith', 'Jones', 'Brown', 'Davis', 'Wilson'][Math.floor(Math.random() * 5)]}`,
            customerPhone: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
            customerEmail: `customer${i}@example.com`,
            customerAddress: `${Math.floor(Math.random() * 999) + 1} Main St, City`,
            affiliateId: Math.random() > 0.5 ? `affiliate_${Math.random().toString(36).substr(2, 9)}` : null,
            affiliateName: Math.random() > 0.5 ? `Affiliate ${['John', 'Jane', 'Mike', 'Sarah', 'Tom'][Math.floor(Math.random() * 5)]}` : null,
            discountType: Math.random() > 0.5 ? 'percentage' : 'fixed',
            discountValue: Math.random() > 0.5 ? Math.floor(Math.random() * 30) + 10 : Math.floor(Math.random() * 50) + 5,
            commissionEarned: Math.floor(Math.random() * 20) + 5,
            customerRewardPoints: Math.floor(Math.random() * 50) + 10,
            redeemedAt: redemptionDate.toISOString(),
            isVerifiedCustomer: Math.random() > 0.3,
            hasCompleteProfile: Math.random() > 0.4,
            dataSource: 'mock_data'
        });
    }
    
    return mockRedemptions.sort((a, b) => new Date(b.redeemedAt).getTime() - new Date(a.redeemedAt).getTime());
};

const generateMockAffiliates = (shopId: string): any[] => {
    const affiliateCount = Math.floor(Math.random() * 8) + 3; // 3-10 affiliates
    const mockAffiliates = [];
    
    for (let i = 0; i < affiliateCount; i++) {
        const affiliateId = `affiliate_${shopId}_${i}`;
        const redemptionCount = Math.floor(Math.random() * 15) + 1;
        const commissionPerRedemption = Math.floor(Math.random() * 25) + 5;
        
        mockAffiliates.push({
            affiliateId,
            affiliateName: `Affiliate ${['Alex', 'Sam', 'Chris', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley'][i % 8]}`,
            redemptions: generateMockRedemptions(shopId, redemptionCount).map(r => ({ ...r, affiliateId, affiliateName: `Affiliate ${['Alex', 'Sam', 'Chris', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley'][i % 8]}` })),
            totalCommission: redemptionCount * commissionPerRedemption,
            totalRedemptions: redemptionCount,
            conversionRate: (Math.random() * 30 + 10).toFixed(1) + '%',
            lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
        });
    }
    
    return mockAffiliates.sort((a, b) => b.totalRedemptions - a.totalRedemptions);
};

const generateMockCustomerData = (shopId: string): any[] => {
    const customerCount = Math.floor(Math.random() * 25) + 10; // 10-35 customers
    const mockCustomers = [];
    
    for (let i = 0; i < customerCount; i++) {
        const customerId = `customer_${shopId}_${i}`;
        const redemptionDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000); // Last 30 days
        
        mockCustomers.push({
            id: `customer_data_${shopId}_${i}`,
            userId: customerId,
            customerName: `${['Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'William', 'Sophia', 'James', 'Isabella', 'Oliver'][i % 10]} ${['Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez'][i % 10]}`,
            customerPhone: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
            customerEmail: `customer${i}@domain${Math.floor(Math.random() * 5)}.com`,
            customerAddress: `${Math.floor(Math.random() * 9999) + 1} ${['Oak', 'Maple', 'Pine', 'Cedar', 'Elm'][Math.floor(Math.random() * 5)]} Street, ${['Springfield', 'Franklin', 'Georgetown', 'Fairview', 'Madison'][Math.floor(Math.random() * 5)]}`,
            customerAge: Math.floor(Math.random() * 50) + 18,
            customerGender: ['Male', 'Female', 'Other'][Math.floor(Math.random() * 3)],
            couponId: `coupon_${shopId}_${Math.floor(Math.random() * 5)}`,
            couponTitle: `Mock Coupon ${Math.floor(Math.random() * 5) + 1}`,
            shopOwnerId: shopId,
            shopOwnerName: `Shop Owner ${shopId.slice(-4)}`,
            affiliateId: Math.random() > 0.4 ? `affiliate_${shopId}_${Math.floor(Math.random() * 5)}` : null,
            affiliateName: Math.random() > 0.4 ? `Affiliate ${Math.floor(Math.random() * 5) + 1}` : null,
            discountType: Math.random() > 0.5 ? 'percentage' : 'fixed',
            discountValue: Math.random() > 0.5 ? Math.floor(Math.random() * 30) + 10 : Math.floor(Math.random() * 50) + 5,
            commissionEarned: Math.floor(Math.random() * 20) + 5,
            customerRewardPoints: Math.floor(Math.random() * 50) + 10,
            redeemedAt: redemptionDate.toISOString(),
            timestamp: redemptionDate.toISOString(),
            isVerifiedCustomer: Math.random() > 0.3,
            hasCompleteProfile: Math.random() > 0.4,
            dataSource: 'mock_customer_data',
            source: 'mockCustomerData'
        });
    }
    
    return mockCustomers.sort((a, b) => new Date(b.redeemedAt).getTime() - new Date(a.redeemedAt).getTime());
};

// 🚨 CRITICAL: Mock API implementations that were missing
export const mockApi = {
    // ✅ FIXED: Shop owner affiliate visibility
    getRedemptionsForShop: async (shopId: string): Promise<any[]> => {
        console.log('🔧 MOCK: Fetching redemptions for shop:', shopId);
        const mockRedemptions = generateMockRedemptions(shopId, Math.floor(Math.random() * 20) + 10);
        console.log(`🔧 MOCK: Returning ${mockRedemptions.length} redemptions for shop ${shopId}`);
        return mockRedemptions;
    },

    // ✅ FIXED: Shop owner affiliate insights
    getAffiliatesForShop: async (shopId: string): Promise<any[]> => {
        console.log('🔧 MOCK: Fetching affiliates for shop:', shopId);
        const mockAffiliates = generateMockAffiliates(shopId);
        console.log(`🔧 MOCK: Returning ${mockAffiliates.length} affiliates for shop ${shopId}`);
        return mockAffiliates;
    },

    // ✅ FIXED: Shop owner customer data visibility
    getCustomerDataForShop: async (shopId: string): Promise<any[]> => {
        console.log('🔧 MOCK: Fetching customer data for shop:', shopId);
        const mockCustomerData = generateMockCustomerData(shopId);
        console.log(`🔧 MOCK: Returning ${mockCustomerData.length} customer records for shop ${shopId}`);
        return mockCustomerData;
    },

    // ✅ FIXED: Affiliate dashboard customer data
    getCustomerDataForAffiliate: async (affiliateId: string): Promise<any[]> => {
        console.log('🔧 MOCK: Fetching customer data for affiliate:', affiliateId);
        const mockCustomerData = generateMockCustomerData(affiliateId).map(customer => ({
            ...customer,
            affiliateId,
            affiliateName: `Affiliate ${affiliateId.slice(-4)}`
        }));
        console.log(`🔧 MOCK: Returning ${mockCustomerData.length} customer records for affiliate ${affiliateId}`);
        return mockCustomerData;
    },

    // ✅ FIXED: Affiliate redemption data
    getRedemptionsForAffiliate: async (affiliateId: string): Promise<any[]> => {
        console.log('🔧 MOCK: Fetching redemptions for affiliate:', affiliateId);
        const mockRedemptions = generateMockRedemptions(affiliateId, Math.floor(Math.random() * 15) + 5).map(redemption => ({
            ...redemption,
            affiliateId,
            affiliateName: `Affiliate ${affiliateId.slice(-4)}`
        }));
        console.log(`🔧 MOCK: Returning ${mockRedemptions.length} redemptions for affiliate ${affiliateId}`);
        return mockRedemptions;
    },

    // ✅ CRITICAL: Data Intelligence Center methods
    getDirectFirebaseCollection: async (collectionName: string): Promise<any[]> => {
        console.log(`🔧 MOCK: Fetching ${collectionName} collection...`);
        
        if (collectionName === 'adminActivityLog' || collectionName === 'userActionLog') {
            const activityCount = Math.floor(Math.random() * 50) + 20;
            const mockActivities = [];
            
            for (let i = 0; i < activityCount; i++) {
                const hoursAgo = Math.floor(Math.random() * 72);
                const activityDate = new Date(Date.now() - (hoursAgo * 60 * 60 * 1000));
                
                mockActivities.push({
                    id: `activity_${i}`,
                    type: ['CUSTOMER_REDEMPTION', 'SHOP_ACTIVITY', 'AFFILIATE_ACTIVITY', 'USER_SIGNUP'][Math.floor(Math.random() * 4)],
                    action: ['coupon_redeemed', 'coupon_created', 'user_login', 'profile_updated'][Math.floor(Math.random() * 4)],
                    userId: `user_${Math.random().toString(36).substr(2, 9)}`,
                    userName: `User ${Math.floor(Math.random() * 100)}`,
                    timestamp: activityDate,
                    dateOccurred: activityDate.toISOString(),
                    summary: `Mock activity ${i + 1}`,
                    importance: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)]
                });
            }
            
            console.log(`🔧 MOCK: Returning ${mockActivities.length} ${collectionName} records`);
            return mockActivities;
        }
        
        console.log(`🔧 MOCK: Returning empty array for ${collectionName}`);
        return [];
    },

    logUserActivity: async (activityData: any): Promise<void> => {
        console.log('🔧 MOCK: Logging user activity:', activityData);
        return Promise.resolve();
    },

    // ✅ Add other critical missing methods
    getAllShops: async (): Promise<Shop[]> => {
        console.log('🔧 MOCK: Fetching all shops');
        return []; // Return empty array for now
    },

    getAllCoupons: async (): Promise<Coupon[]> => {
        console.log('🔧 MOCK: Fetching all coupons');
        return []; // Return empty array for now
    },

    getAllRedemptions: async (): Promise<any[]> => {
        console.log('🔧 MOCK: Fetching all redemptions');
        const mockRedemptions = generateMockRedemptions('all_shops', 50);
        console.log(`🔧 MOCK: Returning ${mockRedemptions.length} total redemptions`);
        return mockRedemptions;
    },

    getAllReferrals: async (): Promise<Referral[]> => {
        console.log('🔧 MOCK: Fetching all referrals');
        return []; // Return empty array for now
    },

    getAdminCreditLogs: async (): Promise<AdminCreditLog[]> => {
        console.log('🔧 MOCK: Fetching admin credit logs');
        return []; // Return empty array for now
    },

    getCreditRequests: async (): Promise<CreditRequest[]> => {
        console.log('🔧 MOCK: Fetching credit requests');
        return []; // Return empty array for now
    },

    getCreditKeys: async (): Promise<CreditKey[]> => {
        console.log('🔧 MOCK: Fetching credit keys');
        return []; // Return empty array for now
    }
};

console.log('🔧 MOCK API: All critical methods implemented for affiliate and customer data visibility');