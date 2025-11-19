
import React from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { Role } from './types';

import Header from './components/Header';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ShopOwnerDashboard from './pages/ShopOwnerDashboard';
import AffiliateDashboard from './pages/AffiliateDashboard';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import MarketerDashboard from './pages/MarketerDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import ValidationPortalPage from './pages/ValidationPortalPage';
import NotFoundPage from './pages/NotFoundPage';
import ReferralHandlerPage from './pages/ReferralHandlerPage';
import MarketplacePage from './pages/MarketplacePage';
import PartnerPage from './pages/PartnerPage';
import AffiliateNetworkPage from './pages/AffiliateNetworkPage';
import LegalPage from './pages/LegalPage';
import CookieBanner from './components/CookieBanner';
import ProfilePage from './pages/ProfilePage';
import PublicCouponPage from './pages/PublicCouponPage';

const App: React.FC = () => {
  const { user, isSuperAdmin } = useAuth();
  const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'admin@codecraft.com';

  const isAdminUser = user?.roles.includes('admin') && user.email === ADMIN_EMAIL;

  const DashboardRedirect: React.FC = () => {
    if (!user) return <Navigate to="/login" />;
    
    // Super admin gets priority access
    if (isSuperAdmin) {
      return <Navigate to="/super-admin" />;
    }
    
    if (isAdminUser) {
      return <Navigate to="/admin" />;
    }
    if (user.roles.includes('shop-owner')) {
      return <Navigate to="/shop-owner" />;
    }
    if (user.roles.includes('affiliate')) {
      return <Navigate to="/affiliate" />;
    }
    if (user.roles.includes('user')) {
      return <Navigate to="/customer" />;
    }
    
    return <Navigate to="/login" />;
  };

  const ProtectedRoute: React.FC<{ roles: Role[], children: React.ReactNode }> = ({ roles, children }) => {
    const location = useLocation();

    if (!user) {
      return (
        <Navigate
          to="/login"
          state={{ from: location.pathname + location.search }}
          replace
        />
      );
    }
    const requiresAdmin = roles.includes('admin');
    const hasRequiredRole = roles.some(role => user.roles.includes(role));

    if (requiresAdmin && !isAdminUser) {
      return <Navigate to="/dashboard" />;
    }

    return hasRequiredRole ? <>{children}</> : <Navigate to="/dashboard" />;
  };

  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={user ? <DashboardRedirect /> : <LoginPage />} />
            <Route path="/refer/:shopId" element={<ReferralHandlerPage />} />
            
            <Route path="/shop-owner" element={<ProtectedRoute roles={['shop-owner']}><ShopOwnerDashboard /></ProtectedRoute>} />
            <Route path="/affiliate" element={<ProtectedRoute roles={['affiliate']}><AffiliateDashboard /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/super-admin" element={<SuperAdminDashboard />} />
            <Route path="/customer" element={<ProtectedRoute roles={['user']}><UserDashboard /></ProtectedRoute>} />
            
            {/* Legacy routes for backward compatibility */}
            <Route path="/marketer" element={<ProtectedRoute roles={['affiliate']}><AffiliateDashboard /></ProtectedRoute>} />
            <Route path="/user" element={<ProtectedRoute roles={['user']}><UserDashboard /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute roles={['shop-owner']}><ProfilePage /></ProtectedRoute>} />


            <Route path="/dashboard" element={<DashboardRedirect />} />
            
            <Route path="/coupon/:id" element={<PublicCouponPage />} />
            <Route path="/validate/:id" element={<ProtectedRoute roles={['shop-owner', 'user', 'affiliate']}><ValidationPortalPage /></ProtectedRoute>} />
            
            <Route path="/partner-with-us" element={<PartnerPage />} />
            <Route path="/affiliate-network" element={<AffiliateNetworkPage />} />
            <Route path="/marketplace" element={<MarketplacePage />} />
            <Route path="/legal" element={<LegalPage />} />

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <CookieBanner />
      </div>
    </HashRouter>
  );
};

export default App;
