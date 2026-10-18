import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { LoadingScreen } from './LoadingScreen';

export function ProtectedRoute({
  children,
  adminOnly = false,
}: {
  children: ReactNode;
  adminOnly?: boolean;
}) {
  const { firebaseUser, appUser, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingScreen />;
  if (!firebaseUser || !appUser) {
    return <Navigate to="/signin" replace state={{ from: location.pathname }} />;
  }
  if (adminOnly && appUser.role !== 'admin') return <Navigate to="/" replace />;
  if (!adminOnly && appUser.role === 'admin') return <Navigate to="/admin" replace />;
  return children;
}
