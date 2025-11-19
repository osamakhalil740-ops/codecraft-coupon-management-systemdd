import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface RoleGuardProps {
  allowedRoles: string[];
  children: React.ReactNode;
  redirectTo?: string;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ 
  allowedRoles, 
  children, 
  redirectTo = '/login' 
}) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has any of the allowed roles
  const hasAllowedRole = allowedRoles.some(role => user.roles.includes(role));

  if (!hasAllowedRole) {
    // Redirect to appropriate dashboard based on user's role
    if (user.roles.includes('admin')) {
      return <Navigate to="/admin" replace />;
    }
    if (user.roles.includes('shop-owner')) {
      return <Navigate to="/shop-owner" replace />;
    }
    if (user.roles.includes('affiliate')) {
      return <Navigate to="/affiliate" replace />;
    }
    if (user.roles.includes('user')) {
      return <Navigate to="/customer" replace />;
    }
    
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};