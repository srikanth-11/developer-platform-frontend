import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createApplication, deleteApplication, listApplications } from './api';

/** Query keys are scoped by org, so switching orgs fetches the right list. */
export const applicationKeys = {
  list: (orgId: string) => ['applications', orgId] as const,
};

export function useApplications(orgId: string | null) {
  return useQuery({
    queryKey: applicationKeys.list(orgId ?? ''),
    queryFn: () => listApplications(orgId as string),
    enabled: !!orgId, // don't fetch until an org is selected
  });
}

export function useCreateApplication(orgId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof createApplication>[1]) =>
      createApplication(orgId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.list(orgId) });
    },
  });
}

export function useDeleteApplication(orgId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteApplication(orgId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.list(orgId) });
    },
  });
}
