import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/PageHeader';
import { useConfirm } from '@/components/confirm-context';
import { useActiveOrg } from '@/features/organizations/active-org-context';
import { getApiErrorMessage } from '@/lib/api';
import { Role, roleAtLeast } from '@/lib/enums';
import { ApiCard, CardGrid, CardGridSkeleton, EmptyNote, ErrorBox } from './ApiCard';
import { confirmSubscription } from './api';
import {
  marketplaceKeys,
  useBrowseApis,
  useSubscribeToApi,
  useSubscriptions,
  useUnsubscribe,
} from './hooks';

/** Subscriber dashboard: discover and manage marketplace subscriptions. */
export function MarketplacePage() {
  const { activeOrg, activeOrgId } = useActiveOrg();
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();
  const [category, setCategory] = useState('');
  const browse = useBrowseApis(category);
  const subs = useSubscriptions(activeOrgId);
  const subscribe = useSubscribeToApi(activeOrgId ?? '');
  const unsubscribe = useUnsubscribe(activeOrgId ?? '');
  const confirm = useConfirm();

  // Handle return from Stripe Checkout for a paid subscription.
  useEffect(() => {
    if (!activeOrgId) return;
    const status = params.get('checkout');
    const sessionId = params.get('session_id');
    if (status === 'success' && sessionId) {
      confirmSubscription(activeOrgId, sessionId)
        .then(() => {
          toast.success('Subscription active — payment received.');
          queryClient.invalidateQueries({ queryKey: marketplaceKeys.subscriptions(activeOrgId) });
        })
        .catch((err) => toast.error(getApiErrorMessage(err, 'Could not confirm subscription')));
    } else if (status === 'cancel') {
      toast('Checkout canceled — no changes made.');
    }
    if (status) setParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOrgId]);

  const canManage = roleAtLeast(activeOrg?.role, Role.DEVELOPER);
  const subscribedApiIds = new Set((subs.data ?? []).map((s) => s.api?.id).filter(Boolean));

  async function handleSubscribe(apiId: string, name: string) {
    try {
      const res = await subscribe.mutateAsync(apiId);
      if (res.url) {
        window.open(res.url, '_blank', 'noopener,noreferrer'); // paid API → Stripe Checkout (new tab)
        return;
      }
      toast.success(`Subscribed to “${name}”`);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not subscribe'));
    }
  }

  async function handleUnsubscribe(subscriptionId: string, name: string) {
    const ok = await confirm({
      title: `Unsubscribe from “${name}”?`,
      description: 'You will lose access to this API. You can re-subscribe later.',
      confirmLabel: 'Unsubscribe',
      destructive: true,
    });
    if (!ok) return;
    try {
      await unsubscribe.mutateAsync(subscriptionId);
      toast.success(`Unsubscribed from “${name}”`);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not unsubscribe'));
    }
  }

  if (!activeOrgId) {
    return (
      <div>
        <PageHeader title="Marketplace" />
        <EmptyNote>Loading your workspace…</EmptyNote>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Marketplace" description="Discover and subscribe to APIs from other teams." />

      <Tabs defaultValue="browse">
        <TabsList>
          <TabsTrigger value="browse">Browse</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-4">
          <Input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Filter by category (e.g. Weather)…"
            className="max-w-xs"
          />
          {browse.isLoading && <CardGridSkeleton />}
          {browse.isError && <ErrorBox error={browse.error} fallback="Could not load catalog" />}
          {browse.data && browse.data.length === 0 && <EmptyNote>No APIs published yet.</EmptyNote>}
          {browse.data && browse.data.length > 0 && (
            <CardGrid>
              {browse.data.map((apiItem) => (
                <ApiCard key={apiItem.id} api={apiItem}>
                  {canManage &&
                    (subscribedApiIds.has(apiItem.id) ? (
                      <Badge variant="success">Subscribed</Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={subscribe.isPending}
                        onClick={() => handleSubscribe(apiItem.id, apiItem.name)}
                      >
                        Subscribe
                      </Button>
                    ))}
                </ApiCard>
              ))}
            </CardGrid>
          )}
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-4">
          {subs.isLoading && <CardGridSkeleton />}
          {subs.isError && <ErrorBox error={subs.error} fallback="Could not load subscriptions" />}
          {subs.data && subs.data.length === 0 && <EmptyNote>No subscriptions yet.</EmptyNote>}
          {subs.data && subs.data.length > 0 && (
            <CardGrid>
              {subs.data.map((sub) =>
                sub.api ? (
                  <ApiCard key={sub.subscriptionId} api={sub.api}>
                    {canManage && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        disabled={unsubscribe.isPending}
                        onClick={() => handleUnsubscribe(sub.subscriptionId, sub.api!.name)}
                      >
                        <Trash2 className="size-4" />
                        Unsubscribe
                      </Button>
                    )}
                  </ApiCard>
                ) : null,
              )}
            </CardGrid>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
