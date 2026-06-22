import { QueryClient } from '@tanstack/react-query';

/**
 * One shared React Query client for the whole app.
 *
 * Defaults tuned for a dashboard:
 *  - `staleTime: 30s` — don't refetch the same data on every mount/focus within
 *    30s; dashboards re-render a lot and we don't want a request storm.
 *  - `retry: 1` — one retry smooths over a transient blip, but we don't want to
 *    hammer a genuinely-down API (or retry a 4xx that will never succeed).
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
