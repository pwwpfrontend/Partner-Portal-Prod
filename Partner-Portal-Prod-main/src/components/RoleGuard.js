import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const RoleGuard = ({ allowedRoles, children }) => {
  const { isAuthenticated, isAuthorized, currentRole, loading } = useAuth(allowedRoles);

  // Only log in development environment
  if (process.env.NODE_ENV === "development") {
    console.log('RoleGuard:', { allowedRoles, isAuthenticated, isAuthorized, loading, currentRole });
  }

  if (loading) {
    if (process.env.NODE_ENV === "development") {
      console.log('RoleGuard: Loading...');
    }
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#405952]"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (process.env.NODE_ENV === "development") {
      console.log('RoleGuard: Not authenticated, redirecting to login');
    }
    return <Navigate to="/login" replace />;
  }

  // Admin override: admin can access all role-guarded content
  if (currentRole === "admin") {
    if (process.env.NODE_ENV === "development") {
      console.log('RoleGuard: Admin access granted');
    }
    return children;
  }

  if (!isAuthorized) {
    if (process.env.NODE_ENV === "development") {
      console.log('RoleGuard: Not authorized, redirecting to unauthorized');
    }
    return <Navigate to="/unauthorized" replace />;
  }

  if (process.env.NODE_ENV === "development") {
    console.log('RoleGuard: Authorized, rendering children');
  }
  return children;
};

export default RoleGuard;
