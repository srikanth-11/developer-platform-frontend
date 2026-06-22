/**
 * Mirrors of the backend enums (string values must match exactly).
 * Kept in one shared place since roles/plans show up across many features.
 */
export const Role = {
  OWNER: 'owner',
  ADMIN: 'admin',
  DEVELOPER: 'developer',
  VIEWER: 'viewer',
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const Plan = {
  FREE: 'free',
  PRO: 'pro',
  ENTERPRISE: 'enterprise',
} as const;
export type Plan = (typeof Plan)[keyof typeof Plan];

/** Organization purpose — publisher (lists APIs) vs subscriber (consumes APIs). */
export const OrganizationType = {
  PUBLISHER: 'publisher',
  SUBSCRIBER: 'subscriber',
} as const;
export type OrganizationType = (typeof OrganizationType)[keyof typeof OrganizationType];

export const ORG_TYPE_LABELS: Record<OrganizationType, string> = {
  publisher: 'Publisher',
  subscriber: 'Subscriber',
};

/** Human labels for display. */
export const ROLE_LABELS: Record<Role, string> = {
  owner: 'Owner',
  admin: 'Admin',
  developer: 'Developer',
  viewer: 'Viewer',
};

export const PLAN_LABELS: Record<Plan, string> = {
  free: 'Free',
  pro: 'Pro',
  enterprise: 'Enterprise',
};

/**
 * Role ranking (mirrors the backend's ROLE_RANK). Higher = more power, so the UI
 * can mirror server-side `@Roles(...)` checks — e.g. hide a "Create" button a
 * VIEWER isn't allowed to use. This is UX only; the backend still enforces it.
 */
export const ROLE_RANK: Record<Role, number> = {
  viewer: 0,
  developer: 1,
  admin: 2,
  owner: 3,
};

/** Does `role` meet or exceed `required`? */
export function roleAtLeast(role: Role | undefined | null, required: Role): boolean {
  if (!role) return false;
  return ROLE_RANK[role] >= ROLE_RANK[required];
}
