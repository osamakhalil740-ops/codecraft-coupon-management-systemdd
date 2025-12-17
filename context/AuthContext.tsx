import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { Shop, Role } from '../types';
import { auth, db } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { doc, getDoc, setDoc, addDoc, collection, serverTimestamp, updateDoc, arrayUnion } from 'firebase/firestore';
import { FirebaseError } from 'firebase/app';
import { SUPER_ADMIN_EMAIL, CREDIT_CONFIG, isSuperAdmin } from '../config/constants';
import { logger } from '../utils/logger';

interface ShopDetails {
    category: string;
    country: string;
    city: string;
    district?: string;
}

interface AuthContextType {
  user: Shop | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, role: Role, referredBy: string | null, shopDetails?: ShopDetails) => Promise<void>;
  logout: () => void;
  loading: boolean;
  refreshUser: () => Promise<void>;
  isSuperAdmin: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Check if current user is super admin
  const isSuperAdminUser = user?.email ? isSuperAdmin(user.email) : false;

  const fetchUserData = async (firebaseUser: any): Promise<Shop | null> => {
    const userDocRef = doc(db, 'shops', firebaseUser.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
       const userData = userDocSnap.data();
       
       // Check if user is banned
       if (userData.bannedUntil) {
         const bannedUntil = userData.bannedUntil.toDate ? userData.bannedUntil.toDate() : new Date(userData.bannedUntil);
         if (bannedUntil > new Date()) {
           logger.warn('User is banned', { userId: firebaseUser.uid, bannedUntil: bannedUntil.toISOString() });
           signOut(auth);
           alert(`Your account has been banned until ${bannedUntil.toLocaleString()}. ${userData.banReason ? `Reason: ${userData.banReason}` : ''}`);
           return null;
         }
       }
       
       return {
         id: firebaseUser.uid,
         name: userData.name,
         email: userData.email,
         roles: userData.roles || [],
         credits: userData.credits,
         referralCode: userData.referralCode,
         referredBy: userData.referredBy,
         hasRedeemedFirstCoupon: userData.hasRedeemedFirstCoupon,
         country: userData.country || '',
         city: userData.city || '',
         category: userData.category || '',
         district: userData.district || '',
         shopDescription: userData.shopDescription || '',
         addressLine1: userData.addressLine1 || '',
         addressLine2: userData.addressLine2 || '',
         state: userData.state || '',
         postalCode: userData.postalCode || '',
       };
     }
     return null;
  }

  useEffect(() => {
    // Set a timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      logger.warn('Auth initialization timeout - rendering app anyway');
      setLoading(false);
    }, 5000); // 5 second timeout
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const appUser = await fetchUserData(firebaseUser);
          if (appUser) {
            setUser(appUser);
          } else {
            logger.error("User details not found in Firestore!");
            setUser(null);
            signOut(auth);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        logger.error('Error in auth state change:', error);
        setUser(null);
      } finally {
        clearTimeout(loadingTimeout);
        setLoading(false);
      }
    });

    return () => {
      clearTimeout(loadingTimeout);
      unsubscribe();
    };
  }, []);
  
  const refreshUser = async () => {
    if (auth.currentUser) {
        const updatedUser = await fetchUserData(auth.currentUser);
        setUser(updatedUser);
    }
  }

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signup = async (email: string, password: string, name: string, role: Role, referredBy: string | null, shopDetails?: ShopDetails) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;
        
        const initialCredits = referredBy 
          ? CREDIT_CONFIG.REFERRED_SIGNUP_BONUS 
          : CREDIT_CONFIG.STANDARD_SIGNUP_BONUS;
        const referralCode = firebaseUser.uid.substring(0, 8);

        const userDocRef = doc(db, 'shops', firebaseUser.uid);
        await setDoc(userDocRef, {
          name,
          email,
          roles: [role],
          credits: initialCredits,
          referralCode: referralCode,
          referredBy: referredBy || null,
          hasRedeemedFirstCoupon: false,
          createdAt: serverTimestamp(),
          country: role === 'shop-owner' ? shopDetails?.country : '',
          city: role === 'shop-owner' ? shopDetails?.city : '',
          category: role === 'shop-owner' ? shopDetails?.category : '',
          district: role === 'shop-owner' ? shopDetails?.district : '',
          shopDescription: '',
          addressLine1: '',
          addressLine2: '',
          state: '',
          postalCode: '',
        });

        const adminLogRef = collection(db, 'adminCreditLogs');
        await addDoc(adminLogRef, {
            type: referredBy ? 'Referred Signup' : 'Standard Signup',
            shopId: firebaseUser.uid,
            shopName: name,
            amount: initialCredits,
            timestamp: serverTimestamp(),
        });

        if (referredBy) {
            const referralsRef = collection(db, 'referrals');
            await addDoc(referralsRef, {
                referrerId: referredBy,
                referredId: firebaseUser.uid,
                referredShopName: name,
                status: 'pending',
                signupDate: serverTimestamp(),
            });
        }
    } catch (error) {
        if (error instanceof FirebaseError && error.code === 'auth/email-already-in-use') {
            try {
                await signInWithEmailAndPassword(auth, email, password);
                const userDocRef = doc(db, 'shops', auth.currentUser!.uid);
                
                await updateDoc(userDocRef, {
                    roles: arrayUnion(role) 
                });
                await refreshUser();

            } catch (signInError) {
                throw new Error("This email is already registered. Please enter the correct password to add a new role, or login.");
            }
        } else {
            throw error;
        }
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading, refreshUser, isSuperAdmin: isSuperAdminUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};