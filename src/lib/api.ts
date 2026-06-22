import axios, { AxiosError } from 'axios';
import { env } from './env';
import { clearToken, getToken } from './token';

/**
 * The single axios instance every feature uses to talk to the backend.
 * Centralizing it gives us two cross-cutting behaviors via interceptors:
 *   1. attach the JWT to every request, and
 *   2. react once to an expired/invalid token (401) — log out.
 */
export const api = axios.create({
  baseURL: env.apiBaseUrl,
  headers: { 'Content-Type': 'application/json' },
});

// --- Request interceptor: attach the Bearer token if we have one. ---
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * The auth layer (Step 3) registers a callback here so that when the API says
 * 401, the app can clear its in-memory user and route to /login. Keeping this a
 * settable handler avoids a circular import between the api client and the auth
 * provider.
 */
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(handler: () => void): void {
  onUnauthorized = handler;
}

// --- Response interceptor: on 401, drop the token and notify the app. ---
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      clearToken();
      onUnauthorized?.();
    }
    return Promise.reject(error);
  },
);

/**
 * The backend's AllExceptionsFilter returns errors as
 * `{ statusCode, message, ... }`, where `message` is a string OR a string[]
 * (validation errors). This normalizes any axios error into one display string.
 */
export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string | string[] } | undefined;
    const msg = data?.message;
    if (Array.isArray(msg)) return msg.join(', ');
    if (typeof msg === 'string') return msg;
    return error.message || fallback;
  }
  return fallback;
}
