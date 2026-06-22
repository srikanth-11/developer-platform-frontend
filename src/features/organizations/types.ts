import type { OrganizationType, Plan, Role } from '@/lib/enums';

/** One row from GET /organizations — my orgs, each with my role in it. */
export interface OrganizationSummary {
  id: string;
  name: string;
  slug: string;
  type: OrganizationType;
  role: Role;
  joinedAt: string;
}

/** Full org from GET /organizations/:id. */
export interface Organization {
  id: string;
  name: string;
  slug: string;
  type: OrganizationType;
  plan: Plan;
  requestsPerMinute: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrganizationPayload {
  name: string;
  type: OrganizationType;
}
