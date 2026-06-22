/** A published API as returned by the catalog/owned endpoints (view shape). */
export interface MarketplaceApi {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  version: string;
  baseUrl: string;
  pricePerMonth: number;
  ownerOrganizationId: string;
  status: string; // draft | published
  publishedAt: string;
}

/** One row of GET …/marketplace/subscriptions. */
export interface ApiSubscription {
  subscriptionId: string;
  status: string; // active | canceled
  api: MarketplaceApi | null;
  subscribedAt: string;
}

export interface PublishApiPayload {
  name: string;
  description?: string;
  category?: string;
  version?: string;
  baseUrl: string;
  pricePerMonth?: number;
}
