import type { Plan } from '@/lib/enums';

/** GET /billing/subscription. */
export interface Subscription {
  plan: Plan;
  status: string; // active | canceled
  monthlyQuota: number;
  pricePerMonth: number;
  overagePerThousand: number;
  currentPeriodStart: string;
  currentPeriodEnd: string;
}

/** GET /billing/usage — live projected bill for the current period (numbers). */
export interface Usage {
  plan: Plan;
  periodStart: string;
  periodEnd: string;
  includedRequests: number;
  usedRequests: number;
  overageRequests: number;
  baseCost: number;
  overageCost: number;
  totalCost: number;
}

/**
 * GET /billing/invoices — a closed BillingRecord. Postgres returns `bigint` and
 * `numeric` columns as STRINGS, so the count/money fields are typed as string
 * and parsed at display time.
 */
export interface Invoice {
  id: string;
  plan: Plan;
  periodStart: string;
  periodEnd: string;
  includedRequests: string;
  usedRequests: string;
  overageRequests: string;
  baseCost: string;
  overageCost: string;
  totalCost: string;
  status: string; // open | invoiced | paid
  createdAt: string;
}
