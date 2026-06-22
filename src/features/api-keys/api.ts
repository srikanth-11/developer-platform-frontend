import { api } from '@/lib/api';
import type { ApiKey, CreateApiKeyPayload, CreatedApiKey } from './types';

const base = (orgId: string, appId: string) =>
  `/organizations/${orgId}/applications/${appId}/api-keys`;

/** GET …/api-keys — masked list. */
export async function listApiKeys(orgId: string, appId: string): Promise<ApiKey[]> {
  const { data } = await api.get<ApiKey[]>(base(orgId, appId));
  return data;
}

/** POST …/api-keys (DEVELOPER+) — returns the plaintext key once. */
export async function createApiKey(
  orgId: string,
  appId: string,
  payload: CreateApiKeyPayload,
): Promise<CreatedApiKey> {
  const { data } = await api.post<CreatedApiKey>(base(orgId, appId), payload);
  return data;
}

/** POST …/api-keys/:keyId/revoke (DEVELOPER+). */
export async function revokeApiKey(
  orgId: string,
  appId: string,
  keyId: string,
): Promise<ApiKey> {
  const { data } = await api.post<ApiKey>(`${base(orgId, appId)}/${keyId}/revoke`);
  return data;
}

/** POST …/api-keys/:keyId/rotate (DEVELOPER+) — revokes the old, returns a new plaintext key. */
export async function rotateApiKey(
  orgId: string,
  appId: string,
  keyId: string,
): Promise<CreatedApiKey> {
  const { data } = await api.post<CreatedApiKey>(`${base(orgId, appId)}/${keyId}/rotate`);
  return data;
}
