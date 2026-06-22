import { api } from '@/lib/api';
import type { PortalIndex, SdkInfo } from './types';

/** GET /api/developer-portal — resource index. */
export async function getPortalIndex(): Promise<PortalIndex> {
  const { data } = await api.get<PortalIndex>('/developer-portal');
  return data;
}

/** GET /api/developer-portal/sdks. */
export async function getSdkInfo(): Promise<SdkInfo> {
  const { data } = await api.get<SdkInfo>('/developer-portal/sdks');
  return data;
}

/** GET /api/developer-portal/postman — the collection JSON (for download). */
export async function getPostmanCollection(): Promise<unknown> {
  const { data } = await api.get('/developer-portal/postman');
  return data;
}
