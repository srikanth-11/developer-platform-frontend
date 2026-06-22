/**
 * Auth types — mirror the backend's API contract.
 *
 * `User` matches what the backend returns (the entity minus `passwordHash`,
 * which is `select: false` server-side). See backend `users/entities/user.entity.ts`.
 */
import type { OrganizationType } from '@/lib/enums';
export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  createdAt: string; // JSON serializes Date -> ISO string
  updatedAt: string;
}

/** Response shape of POST /auth/login and POST /auth/register. */
export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  type: OrganizationType;
}
