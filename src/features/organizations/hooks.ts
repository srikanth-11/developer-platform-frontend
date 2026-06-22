import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createOrganization, getOrganization, listOrganizations } from './api';

/** Stable query keys — one place so invalidation can't drift from the queries. */
export const organizationKeys = {
  all: ['organizations'] as const,
  detail: (id: string) => ['organizations', id] as const,
};

export function useOrganizations() {
  return useQuery({
    queryKey: organizationKeys.all,
    queryFn: listOrganizations,
  });
}

export function useOrganization(id: string) {
  return useQuery({
    queryKey: organizationKeys.detail(id),
    queryFn: () => getOrganization(id),
    enabled: !!id,
  });
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createOrganization,
    // After creating, refetch the list so the new org appears immediately.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationKeys.all });
    },
  });
}
