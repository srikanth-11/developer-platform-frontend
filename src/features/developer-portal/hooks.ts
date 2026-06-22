import { useQuery } from '@tanstack/react-query';
import { getPortalIndex, getSdkInfo } from './api';

export const portalKeys = {
  index: ['developer-portal', 'index'] as const,
  sdks: ['developer-portal', 'sdks'] as const,
};

export function usePortalIndex() {
  return useQuery({
    queryKey: portalKeys.index,
    queryFn: getPortalIndex,
    // Portal metadata is effectively static — cache for the session.
    staleTime: Infinity,
  });
}

export function useSdkInfo() {
  return useQuery({
    queryKey: portalKeys.sdks,
    queryFn: getSdkInfo,
    staleTime: Infinity,
  });
}
