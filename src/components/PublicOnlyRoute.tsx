import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/features/auth/auth-context';

/**
 * Inverse of ProtectedRoute: keeps already-authenticated users out of /login
 * and /register (sends them to the dashboard instead). Renders nothing special
 * while loading — these pages are cheap and the redirect resolves quickly.
 */
export function PublicOnlyRoute() {
  const { status } = useAuth();

  if (status === 'authenticated') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
