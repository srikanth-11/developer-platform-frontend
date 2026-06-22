import { api } from '@/lib/api';
import type { ApiSubscription, MarketplaceApi, PublishApiPayload } from './types';

const orgBase = (orgId: string) => `/organizations/${orgId}/marketplace`;

/** GET /api/marketplace/apis?category= — public catalog (any logged-in user). */
export async function browseApis(category?: string): Promise<MarketplaceApi[]> {
  const { data } = await api.get<MarketplaceApi[]>('/marketplace/apis', {
    params: category ? { category } : undefined,
  });
  return data;
}

/** GET …/marketplace/apis — APIs this org has published (VIEWER+). */
export async function listOwnedApis(orgId: string): Promise<MarketplaceApi[]> {
  const { data } = await api.get<MarketplaceApi[]>(`${orgBase(orgId)}/apis`);
  return data;
}

/** POST …/marketplace/apis — publish (DEVELOPER+, feature-gated). */
export async function publishApi(
  orgId: string,
  payload: PublishApiPayload,
): Promise<MarketplaceApi> {
  const { data } = await api.post<MarketplaceApi>(`${orgBase(orgId)}/apis`, payload);
  return data;
}

/** GET …/marketplace/subscriptions (VIEWER+). */
export async function listSubscriptions(orgId: string): Promise<ApiSubscription[]> {
  const { data } = await api.get<ApiSubscription[]>(`${orgBase(orgId)}/subscriptions`);
  return data;
}

/** Result of subscribing: a Stripe URL for paid APIs, or instant for free ones. */
export interface SubscribeResult {
  url?: string | null;
  subscribed?: boolean;
  subscriptionId?: string;
}

/** POST …/marketplace/subscriptions — subscribe (DEVELOPER+, feature-gated). */
export async function subscribeToApi(orgId: string, apiId: string): Promise<SubscribeResult> {
  const { data } = await api.post<SubscribeResult>(`${orgBase(orgId)}/subscriptions`, { apiId });
  return data;
}

/** POST …/marketplace/subscriptions/confirm — finalize a paid subscription on return. */
export async function confirmSubscription(orgId: string, sessionId: string) {
  const { data } = await api.post(`${orgBase(orgId)}/subscriptions/confirm`, { sessionId });
  return data;
}

/** Publisher payout readiness (Stripe Connect — based on the transfers capability). */
export interface ConnectStatus {
  connected: boolean;
  payoutsReady: boolean;
  accountId: string | null;
}

/** GET …/marketplace/connect/status — can this org earn from published APIs? */
export async function getConnectStatus(orgId: string): Promise<ConnectStatus> {
  const { data } = await api.get<ConnectStatus>(`${orgBase(orgId)}/connect/status`);
  return data;
}

/** POST …/marketplace/connect/onboard — Stripe onboarding URL (ADMIN+). */
export async function connectOnboard(orgId: string): Promise<{ url: string }> {
  const { data } = await api.post<{ url: string }>(`${orgBase(orgId)}/connect/onboard`);
  return data;
}

/** Recurring earnings from this org's published APIs. */
export interface Earnings {
  currency: string;
  platformFeePercent: number;
  publishedApis: number;
  totalSubscribers: number;
  grossMonthly: number;
  platformFee: number;
  netMonthly: number;
  perApi: {
    id: string;
    name: string;
    pricePerMonth: number;
    subscribers: number;
    grossMonthly: number;
    netMonthly: number;
  }[];
}

/** GET …/marketplace/earnings */
export async function getEarnings(orgId: string): Promise<Earnings> {
  const { data } = await api.get<Earnings>(`${orgBase(orgId)}/earnings`);
  return data;
}

/** DELETE …/marketplace/subscriptions/:id — unsubscribe (DEVELOPER+). */
export async function unsubscribe(orgId: string, subscriptionId: string) {
  const { data } = await api.delete(`${orgBase(orgId)}/subscriptions/${subscriptionId}`);
  return data;
}
