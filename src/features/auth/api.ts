import { api } from '@/lib/api';
import type { AuthResponse, LoginPayload, RegisterPayload, User } from './types';

/** POST /api/auth/login → { accessToken, user } */
export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/login', payload);
  return data;
}

/** POST /api/auth/register → { accessToken, user } (backend logs the user in immediately) */
export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/register', payload);
  return data;
}

/** GET /api/auth/me → current user (requires Bearer token; used to bootstrap a session) */
export async function getMe(): Promise<User> {
  const { data } = await api.get<User>('/auth/me');
  return data;
}
