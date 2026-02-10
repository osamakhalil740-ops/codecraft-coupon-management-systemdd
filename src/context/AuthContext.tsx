'use client';

import React, { createContext, ReactNode } from 'react';
import { useSession, signIn, signOut as nextAuthSignOut } from 'next-auth/react';
import { Role } from '@prisma/client';

interface User {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  avatar?: string | null;
  emailVerified?: Date | null;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { data: session, status } = useSession();
  const loading = status === 'loading';

  const user: User | null = session?.user
    ? {
        id: session.user.id,
        email: session.user.email || '',
        name: session.user.name || null,
        role: session.user.role,
        avatar: session.user.image || null,
        emailVerified: session.user.emailVerified || null,
      }
    : null;

  const login = async (email: string, password: string) => {
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      throw new Error(result.error);
    }
  };

  const signOutHandler = async () => {
    await nextAuthSignOut({ redirect: false });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        signOut: signOutHandler,
        loading,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    // During SSR/SSG, context might not be available yet
    // Return a safe default instead of throwing
    if (typeof window === 'undefined') {
      return {
        user: null,
        login: async () => {},
        signOut: async () => {},
        loading: true,
        isAuthenticated: false,
      };
    }
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};