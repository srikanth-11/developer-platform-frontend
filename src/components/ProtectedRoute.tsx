import { Loader2 } from 'lucide-react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/features/auth/auth-context';

/**
 * Gate for authenticated areas.
 *  - While the session is bootstrapping (`/auth/me` in flight) we show a spinner
 *    instead of bouncing to /login — otherwise a refresh on a valid session would
 *    flash the login page.
 *  - Once settled, unauthenticated users are redirected to /login.
 */
export function ProtectedRoute() {
  const { status } = useAuth();

  if (status === 'loading') {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
