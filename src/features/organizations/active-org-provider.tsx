import { useCallback, useEffect, useState } from 'react';
import { ACTIVE_ORG_STORAGE_KEY as STORAGE_KEY, ActiveOrgContext } from './active-org-context';
import { useOrganizations } from './hooks';

/**
 * Provides the active org. Selection is persisted in localStorage so it survives
 * refreshes. Mounted *inside* the protected area (it relies on the orgs query,
 * which needs auth).
 */
export function ActiveOrgProvider({ children }: { children: React.ReactNode }) {
  const { data: organizations = [], isLoading } = useOrganizations();
  const [activeOrgId, setActiveOrgIdState] = useState<string | null>(() =>
    localStorage.getItem(STORAGE_KEY),
  );

  const setActiveOrgId = useCallback((id: string) => {
    localStorage.setItem(STORAGE_KEY, id);
    setActiveOrgIdState(id);
  }, []);

  // Once orgs load, make sure the active id points at a real membership:
  // fall back to the first org (or null if the user has none).
  useEffect(() => {
    if (isLoading) return;
    const stillValid = activeOrgId && organizations.some((o) => o.id === activeOrgId);
    if (!stillValid) {
      const first = organizations[0]?.id ?? null;
      setActiveOrgIdState(first);
      if (first) localStorage.setItem(STORAGE_KEY, first);
      else localStorage.removeItem(STORAGE_KEY);
    }
  }, [isLoading, organizations, activeOrgId]);

  const activeOrg = organizations.find((o) => o.id === activeOrgId) ?? null;

  return (
    <ActiveOrgContext.Provider
      value={{ organizations, activeOrgId, activeOrg, setActiveOrgId, isLoading }}
    >
      {children}
    </ActiveOrgContext.Provider>
  );
}
