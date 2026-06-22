import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/PageHeader';
import { useActiveOrg } from '@/features/organizations/active-org-context';
import { Role, roleAtLeast } from '@/lib/enums';
import { ApiCard, CardGrid, CardGridSkeleton, EmptyNote, ErrorBox } from './ApiCard';
import { PublishApiDialog } from './PublishApiDialog';
import { useConnectStatus, useOwnedApis } from './hooks';

/** Publisher dashboard: the APIs this org has listed in the marketplace. */
export function MyApisPage() {
  const { activeOrg, activeOrgId } = useActiveOrg();
  const owned = useOwnedApis(activeOrgId);
  const connect = useConnectStatus(activeOrgId);
  const canManage = roleAtLeast(activeOrg?.role, Role.DEVELOPER);
  // Paid APIs can't be subscribed to until the publisher's payouts are set up.
  const payoutsReady = !!connect.data?.payoutsReady;

  if (!activeOrgId) {
    return (
      <div>
        <PageHeader title="My APIs" />
        <EmptyNote>Loading your workspace…</EmptyNote>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="My APIs" description="APIs you’ve published to the marketplace.">
        {canManage && <PublishApiDialog orgId={activeOrgId} />}
      </PageHeader>

      {owned.isLoading && <CardGridSkeleton />}
      {owned.isError && <ErrorBox error={owned.error} fallback="Could not load your APIs" />}
      {owned.data && owned.data.length === 0 && (
        <EmptyNote>You haven’t published any APIs yet{canManage ? '. Publish your first one.' : '.'}</EmptyNote>
      )}
      {owned.data && owned.data.length > 0 && (
        <CardGrid>
          {owned.data.map((apiItem) => (
            <ApiCard key={apiItem.id} api={apiItem}>
              <div className="flex flex-wrap items-center gap-1.5">
                {apiItem.pricePerMonth > 0 && !payoutsReady && (
                  <Badge variant="warning" title="Set up payouts before this paid API can be subscribed to">
                    Payouts pending
                  </Badge>
                )}
                <Badge variant={apiItem.status === 'published' ? 'success' : 'secondary'}>
                  {apiItem.status}
                </Badge>
              </div>
            </ApiCard>
          ))}
        </CardGrid>
      )}
    </div>
  );
}
