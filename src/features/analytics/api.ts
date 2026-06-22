import { api } from '@/lib/api';
import type { AnalyticsOverview } from './types';

/** GET /api/organizations/:orgId/analytics/overview?days=N (VIEWER+). */
export async function getOverview(orgId: string, days: number): Promise<AnalyticsOverview> {
  const { data } = await api.get<AnalyticsOverview>(
    `/organizations/${orgId}/analytics/overview`,
    { params: { days } },
  );
  return data;
}
