/**
 * JWT persistence.
 *
 * We store the access token in localStorage so a page refresh keeps the user
 * signed in. (Trade-off: localStorage is readable by JS, so it's vulnerable to
 * XSS. The more secure alternative is an httpOnly cookie set by the backend;
 * for this learning project a Bearer token in localStorage keeps the flow
 * simple and matches the backend's `Authorization: Bearer` design.)
 *
 * This is the single source of truth for the token — the axios interceptor
 * reads it, and the auth layer writes it.
 */
const TOKEN_KEY = 'dp.accessToken';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}
