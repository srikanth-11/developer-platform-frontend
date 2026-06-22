import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Plan } from '@/lib/enums';
import {
  closeInvoice,
  createCheckout,
  createPortal,
  getBillingConfig,
  getSubscription,
  getUsage,
  listInvoices,
  subscribe,
} from './api';

export const billingKeys = {
  config: (orgId: string) => ['billing', orgId, 'config'] as const,
  subscription: (orgId: string) => ['billing', orgId, 'subscription'] as const,
  usage: (orgId: string) => ['billing', orgId, 'usage'] as const,
  invoices: (orgId: string) => ['billing', orgId, 'invoices'] as const,
};

export function useBillingConfig(orgId: string | null) {
  return useQuery({
    queryKey: billingKeys.config(orgId ?? ''),
    queryFn: () => getBillingConfig(orgId as string),
    enabled: !!orgId,
    staleTime: Infinity, // server config doesn't change during a session
  });
}

export function useCheckout(orgId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (plan: Plan) => createCheckout(orgId, plan),
    // A FREE downgrade applies immediately (no redirect) — refresh local state.
    onSuccess: (res) => {
      if (res.downgraded) {
        queryClient.invalidateQueries({ queryKey: billingKeys.subscription(orgId) });
        queryClient.invalidateQueries({ queryKey: billingKeys.usage(orgId) });
      }
    },
  });
}

export function usePortal(orgId: string) {
  return useMutation({ mutationFn: () => createPortal(orgId) });
}

export function useSubscription(orgId: string | null) {
  return useQuery({
    queryKey: billingKeys.subscription(orgId ?? ''),
    queryFn: () => getSubscription(orgId as string),
    enabled: !!orgId,
  });
}

export function useUsage(orgId: string | null) {
  return useQuery({
    queryKey: billingKeys.usage(orgId ?? ''),
    queryFn: () => getUsage(orgId as string),
    enabled: !!orgId,
  });
}

export function useInvoices(orgId: string | null) {
  return useQuery({
    queryKey: billingKeys.invoices(orgId ?? ''),
    queryFn: () => listInvoices(orgId as string),
    enabled: !!orgId,
  });
}

export function useSubscribe(orgId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (plan: Plan) => subscribe(orgId, plan),
    // Plan change affects subscription + projected usage cost.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingKeys.subscription(orgId) });
      queryClient.invalidateQueries({ queryKey: billingKeys.usage(orgId) });
    },
  });
}

export function useCloseInvoice(orgId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => closeInvoice(orgId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingKeys.invoices(orgId) });
      queryClient.invalidateQueries({ queryKey: billingKeys.usage(orgId) });
    },
  });
}
