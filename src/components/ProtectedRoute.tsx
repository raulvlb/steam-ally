import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useUserStore } from '@/store/user.store';

/**
 * Protected Route Component
 * Redirects to home if user is not authenticated
 */

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated = useUserStore((state) => state.isAuthenticated());

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
