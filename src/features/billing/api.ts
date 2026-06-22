import { api } from '@/lib/api';
import type { Plan } from '@/lib/enums';
import type { Invoice, Subscription, Usage } from './types';

const base = (orgId: string) => `/organizations/${orgId}/billing`;

/** GET …/billing/subscription (VIEWER+). */
export async function getSubscription(orgId: string): Promise<Subscription> {
  const { data } = await api.get<Subscription>(`${base(orgId)}/subscription`);
  return data;
}

/** GET …/billing/usage (VIEWER+) — live projected bill. */
export async function getUsage(orgId: string): Promise<Usage> {
  const { data } = await api.get<Usage>(`${base(orgId)}/usage`);
  return data;
}

/** GET …/billing/invoices (VIEWER+). */
export async function listInvoices(orgId: string): Promise<Invoice[]> {
  const { data } = await api.get<Invoice[]>(`${base(orgId)}/invoices`);
  return data;
}

/** POST …/billing/subscribe (OWNER) — change plan. */
export async function subscribe(orgId: string, plan: Plan): Promise<Subscription> {
  const { data } = await api.post<Subscription>(`${base(orgId)}/subscribe`, { plan });
  return data;
}

/** POST …/billing/invoices/close (ADMIN+) — close current period into an invoice. */
export async function closeInvoice(orgId: string): Promise<Invoice> {
  const { data } = await api.post<Invoice>(`${base(orgId)}/invoices/close`);
  return data;
}

/** GET …/billing/config — is real Stripe checkout available on this server? */
export async function getBillingConfig(orgId: string): Promise<{ paymentsEnabled: boolean }> {
  const { data } = await api.get<{ paymentsEnabled: boolean }>(`${base(orgId)}/config`);
  return data;
}

/** POST …/billing/checkout (OWNER) — returns a Stripe URL, or downgrades for FREE. */
export async function createCheckout(
  orgId: string,
  plan: Plan,
): Promise<{ url: string | null; downgraded?: boolean }> {
  const { data } = await api.post<{ url: string | null; downgraded?: boolean }>(
    `${base(orgId)}/checkout`,
    { plan },
  );
  return data;
}

/** POST …/billing/checkout/confirm (OWNER) — confirm a returned Checkout Session. */
export async function confirmCheckout(orgId: string, sessionId: string): Promise<Subscription> {
  const { data } = await api.post<Subscription>(`${base(orgId)}/checkout/confirm`, { sessionId });
  return data;
}

/** POST …/billing/portal (OWNER) — Stripe Billing Portal URL. */
export async function createPortal(orgId: string): Promise<{ url: string }> {
  const { data } = await api.post<{ url: string }>(`${base(orgId)}/portal`);
  return data;
}
