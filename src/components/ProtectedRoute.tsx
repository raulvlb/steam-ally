import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useUserStore } from '@/store/user.store';
import { useAuthStore } from '@/store/auth.store';
import { Loader2 } from 'lucide-react';

/**
 * Protected Route Component
 * Redirects to home if user is not authenticated
 */

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isLegacyAuthenticated = useUserStore((state) => state.isAuthenticated());
  const { isAuthenticated: isApiAuthenticated, isLoading } = useAuthStore();

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-steam-accent" />
      </div>
    );
  }

  // Support both legacy auth and API auth
  if (!isLegacyAuthenticated && !isApiAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
