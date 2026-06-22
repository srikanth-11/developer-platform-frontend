import { api } from '@/lib/api';
import type { Application, CreateApplicationPayload } from './types';

/** GET /api/organizations/:orgId/applications */
export async function listApplications(orgId: string): Promise<Application[]> {
  const { data } = await api.get<Application[]>(`/organizations/${orgId}/applications`);
  return data;
}

/** POST /api/organizations/:orgId/applications (DEVELOPER+) */
export async function createApplication(
  orgId: string,
  payload: CreateApplicationPayload,
): Promise<Application> {
  const { data } = await api.post<Application>(
    `/organizations/${orgId}/applications`,
    payload,
  );
  return data;
}

/** DELETE /api/organizations/:orgId/applications/:id (ADMIN+) */
export async function deleteApplication(orgId: string, id: string): Promise<void> {
  await api.delete(`/organizations/${orgId}/applications/${id}`);
}
