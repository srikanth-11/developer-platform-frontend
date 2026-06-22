import { useCallback, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { setUnauthorizedHandler } from '@/lib/api';
import { clearToken, getToken, setToken } from '@/lib/token';
import { ACTIVE_ORG_STORAGE_KEY } from '@/features/organizations/active-org-context';
import * as authApi from './api';
import { AuthContext, type AuthStatus } from './auth-context';
import type { LoginPayload, RegisterPayload, User } from './types';

/**
 * AuthProvider owns the authenticated user + session lifecycle.
 *
 * On mount: if a token is already in localStorage, we verify it by calling
 * /auth/me. A valid token rehydrates the user (refresh keeps you logged in);
 * an invalid/expired one is cleared. With no token we go straight to
 * 'unauthenticated' without a network call.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const queryClient = useQueryClient();

  // Wipe per-account state so one user's session never leaks into the next:
  // the selected org id (localStorage) and all cached server data (React Query).
  const resetSession = useCallback(() => {
    localStorage.removeItem(ACTIVE_ORG_STORAGE_KEY);
    queryClient.clear();
  }, [queryClient]);

  const logout = useCallback(() => {
    clearToken();
    resetSession();
    setUser(null);
    setStatus('unauthenticated');
  }, [resetSession]);

  const login = useCallback(
    async (payload: LoginPayload) => {
      const { accessToken, user } = await authApi.login(payload);
      resetSession(); // start clean — drop any previous account's org/cache
      setToken(accessToken);
      setUser(user);
      setStatus('authenticated');
    },
    [resetSession],
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const { accessToken, user } = await authApi.register(payload);
      resetSession();
      setToken(accessToken);
      setUser(user);
      setStatus('authenticated');
    },
    [resetSession],
  );

  // Let the axios 401 interceptor (Step 2) drive us back to logged-out state.
  useEffect(() => {
    setUnauthorizedHandler(logout);
  }, [logout]);

  // Session bootstrap: validate an existing token exactly once on startup.
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setStatus('unauthenticated');
      return;
    }
    authApi
      .getMe()
      .then((me) => {
        setUser(me);
        setStatus('authenticated');
      })
      .catch(() => {
        // 401 handler already cleared the token; just settle the state.
        setUser(null);
        setStatus('unauthenticated');
      });
  }, []);

  return (
    <AuthContext.Provider value={{ user, status, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
