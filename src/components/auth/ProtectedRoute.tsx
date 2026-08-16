import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import { LoadingState } from '../common/LoadingState';

export interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingState message="Verifying civic credentials..." />
      </div>
    );
  }

  // Unauthenticated user -> redirect to login with return path
  if (!isAuthenticated || !user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // Role validation: If allowedRoles is specified and user's role is not included -> redirect to unauthorized
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" state={{ attemptedPath: location.pathname, userRole: user.role }} replace />;
  }

  return <>{children}</>;
};
