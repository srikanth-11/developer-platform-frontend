export type ApiKeyStatus = 'active' | 'revoked' | 'expired';

/** Masked key view from GET/revoke (never includes the secret). */
export interface ApiKey {
  id: string;
  name: string;
  maskedKey: string; // e.g. "dk_test_••••••••a1b2"
  status: ApiKeyStatus;
  expiresAt: string | null;
  revokedAt: string | null;
  lastUsedAt: string | null;
  usageCount: number;
  createdAt: string;
}

/**
 * Response from create/rotate — the ONLY time the plaintext `key` is returned.
 * Everything else is the same masked shape as ApiKey.
 */
export interface CreatedApiKey extends ApiKey {
  key: string;
  warning: string;
}

export interface CreateApiKeyPayload {
  name: string;
  expiresInDays?: number;
}
