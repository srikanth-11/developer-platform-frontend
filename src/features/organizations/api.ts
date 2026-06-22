import { api } from '@/lib/api';
import type {
  CreateOrganizationPayload,
  Organization,
  OrganizationSummary,
} from './types';

/** GET /api/organizations — orgs the current user belongs to. */
export async function listOrganizations(): Promise<OrganizationSummary[]> {
  const { data } = await api.get<OrganizationSummary[]>('/organizations');
  return data;
}

/** GET /api/organizations/:id — full org detail. */
export async function getOrganization(id: string): Promise<Organization> {
  const { data } = await api.get<Organization>(`/organizations/${id}`);
  return data;
}

/** POST /api/organizations — creator becomes OWNER. */
export async function createOrganization(
  payload: CreateOrganizationPayload,
): Promise<Organization> {
  const { data } = await api.post<Organization>('/organizations', payload);
  return data;
}
