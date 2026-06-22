import { createContext, useContext } from 'react';
import type { OrganizationSummary } from './types';

/** localStorage key for the selected org id (cleared on login/logout). */
export const ACTIVE_ORG_STORAGE_KEY = 'dp.activeOrgId';

/**
 * The "active organization" — which tenant the user is currently working in.
 * Org-scoped pages (applications, API keys, analytics, …) read this to know
 * which `:orgId` to call.
 */
export interface ActiveOrgContextValue {
  organizations: OrganizationSummary[];
  activeOrgId: string | null;
  activeOrg: OrganizationSummary | null;
  setActiveOrgId: (id: string) => void;
  isLoading: boolean;
}

export const ActiveOrgContext = createContext<ActiveOrgContextValue | null>(null);

export function useActiveOrg(): ActiveOrgContextValue {
  const ctx = useContext(ActiveOrgContext);
  if (!ctx) {
    throw new Error('useActiveOrg must be used within an <ActiveOrgProvider>');
  }
  return ctx;
}
