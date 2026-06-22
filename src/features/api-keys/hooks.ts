import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createApiKey, listApiKeys, revokeApiKey, rotateApiKey } from './api';

/** Keyed by app, so each application's keys cache separately. */
export const apiKeyKeys = {
  list: (orgId: string, appId: string) => ['api-keys', orgId, appId] as const,
};

export function useApiKeys(orgId: string | null, appId: string | null) {
  return useQuery({
    queryKey: apiKeyKeys.list(orgId ?? '', appId ?? ''),
    queryFn: () => listApiKeys(orgId as string, appId as string),
    enabled: !!orgId && !!appId,
  });
}

export function useCreateApiKey(orgId: string, appId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof createApiKey>[2]) =>
      createApiKey(orgId, appId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: apiKeyKeys.list(orgId, appId) });
    },
  });
}

export function useRevokeApiKey(orgId: string, appId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (keyId: string) => revokeApiKey(orgId, appId, keyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: apiKeyKeys.list(orgId, appId) });
    },
  });
}

export function useRotateApiKey(orgId: string, appId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (keyId: string) => rotateApiKey(orgId, appId, keyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: apiKeyKeys.list(orgId, appId) });
    },
  });
}
