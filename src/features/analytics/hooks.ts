import { useQuery } from '@tanstack/react-query';
import { getOverview } from './api';

/** Keyed by org + range so each window caches independently. */
export const analyticsKeys = {
  overview: (orgId: string, days: number) => ['analytics', orgId, 'overview', days] as const,
};

export function useAnalyticsOverview(orgId: string | null, days: number) {
  return useQuery({
    queryKey: analyticsKeys.overview(orgId ?? '', days),
    queryFn: () => getOverview(orgId as string, days),
    enabled: !!orgId,
  });
}
