/** Headline metrics from /analytics/summary (embedded in overview). */
export interface AnalyticsSummary {
  rangeDays: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  errorRate: number; // 0..1
  avgResponseMs: number;
  p95ResponseMs: number;
  maxResponseMs: number;
}

/** One row of /analytics/top-endpoints. */
export interface TopEndpoint {
  endpoint: string;
  method: string;
  count: number;
  avgResponseMs: number;
  errors: number;
}

/** One day of /analytics/daily (time series). */
export interface DailyPoint {
  day: string; // 'YYYY-MM-DD'
  total: number;
  errors: number;
  avgResponseMs: number;
}

/** /analytics/overview — everything the dashboard needs in one call. */
export interface AnalyticsOverview {
  summary: AnalyticsSummary;
  topEndpoints: TopEndpoint[];
  daily: DailyPoint[];
}
