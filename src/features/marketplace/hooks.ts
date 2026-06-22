import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  browseApis,
  connectOnboard,
  getConnectStatus,
  getEarnings,
  listOwnedApis,
  listSubscriptions,
  publishApi,
  subscribeToApi,
  unsubscribe,
} from './api';
import type { PublishApiPayload } from './types';

export const marketplaceKeys = {
  browse: (category: string) => ['marketplace', 'browse', category] as const,
  owned: (orgId: string) => ['marketplace', orgId, 'owned'] as const,
  subscriptions: (orgId: string) => ['marketplace', orgId, 'subscriptions'] as const,
  connect: (orgId: string) => ['marketplace', orgId, 'connect'] as const,
  earnings: (orgId: string) => ['marketplace', orgId, 'earnings'] as const,
};

export function useConnectStatus(orgId: string | null) {
  return useQuery({
    queryKey: marketplaceKeys.connect(orgId ?? ''),
    queryFn: () => getConnectStatus(orgId as string),
    enabled: !!orgId,
    refetchOnWindowFocus: true, // pick up payout status changes when you return
  });
}

export function useEarnings(orgId: string | null) {
  return useQuery({
    queryKey: marketplaceKeys.earnings(orgId ?? ''),
    queryFn: () => getEarnings(orgId as string),
    enabled: !!orgId,
  });
}

export function useConnectOnboard(orgId: string) {
  return useMutation({ mutationFn: () => connectOnboard(orgId) });
}

export function useBrowseApis(category: string) {
  return useQuery({
    queryKey: marketplaceKeys.browse(category),
    queryFn: () => browseApis(category || undefined),
  });
}

export function useOwnedApis(orgId: string | null) {
  return useQuery({
    queryKey: marketplaceKeys.owned(orgId ?? ''),
    queryFn: () => listOwnedApis(orgId as string),
    enabled: !!orgId,
  });
}

export function useSubscriptions(orgId: string | null) {
  return useQuery({
    queryKey: marketplaceKeys.subscriptions(orgId ?? ''),
    queryFn: () => listSubscriptions(orgId as string),
    enabled: !!orgId,
  });
}

export function usePublishApi(orgId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PublishApiPayload) => publishApi(orgId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: marketplaceKeys.owned(orgId) });
      queryClient.invalidateQueries({ queryKey: ['marketplace', 'browse'] });
    },
  });
}

export function useSubscribeToApi(orgId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (apiId: string) => subscribeToApi(orgId, apiId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: marketplaceKeys.subscriptions(orgId) });
    },
  });
}

export function useUnsubscribe(orgId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (subscriptionId: string) => unsubscribe(orgId, subscriptionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: marketplaceKeys.subscriptions(orgId) });
    },
  });
}
