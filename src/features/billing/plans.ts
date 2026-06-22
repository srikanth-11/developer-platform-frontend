import { Plan } from '@/lib/enums';

/**
 * Commercial terms per plan — mirrors the backend `billing.constants.ts`
 * (`PLAN_TERMS`). Kept here so the plan-picker can show quota/price for plans the
 * org isn't on yet (the API only returns the *current* subscription's terms).
 * If the backend terms change, update both.
 */
export interface PlanCatalogEntry {
  plan: Plan;
  name: string;
  monthlyQuota: number;
  pricePerMonth: number;
  overagePerThousand: number;
  requestsPerMinute: number;
  tagline: string;
}

export const PLAN_CATALOG: PlanCatalogEntry[] = [
  {
    plan: Plan.FREE,
    name: 'Free',
    monthlyQuota: 10_000,
    pricePerMonth: 0,
    overagePerThousand: 0,
    requestsPerMinute: 100,
    tagline: 'For trying things out.',
  },
  {
    plan: Plan.PRO,
    name: 'Pro',
    monthlyQuota: 1_000_000,
    pricePerMonth: 49,
    overagePerThousand: 0.5,
    requestsPerMinute: 5_000,
    tagline: 'For production apps.',
  },
  {
    plan: Plan.ENTERPRISE,
    name: 'Enterprise',
    monthlyQuota: 50_000_000,
    pricePerMonth: 999,
    overagePerThousand: 0.2,
    requestsPerMinute: 50_000,
    tagline: 'For high-volume platforms.',
  },
];
