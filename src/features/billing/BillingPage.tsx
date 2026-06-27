import { useEffect } from 'react';
import { CreditCard, Check, CreditCard as CardIcon, ExternalLink } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PageHeader } from '@/components/PageHeader';
import { useConfirm } from '@/components/confirm-context';
import { useActiveOrg } from '@/features/organizations/active-org-context';
import { useEarnings } from '@/features/marketplace/hooks';
import { getApiErrorMessage } from '@/lib/api';
import { OrganizationType, PLAN_LABELS, Role, roleAtLeast, type Plan } from '@/lib/enums';
import { cn } from '@/lib/utils';
import { formatCurrency, formatDate, formatNumber } from '@/lib/format';
import { confirmCheckout } from './api';
import { PLAN_CATALOG } from './plans';
import {
  billingKeys,
  useBillingConfig,
  useCheckout,
  useCloseInvoice,
  useInvoices,
  usePortal,
  useSubscribe,
  useSubscription,
  useUsage,
} from './hooks';

export function BillingPage() {
  const { activeOrg, activeOrgId } = useActiveOrg();
  const isPublisher = activeOrg?.type === OrganizationType.PUBLISHER;
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();
  const earnings = useEarnings(isPublisher ? activeOrgId : null);
  const sub = useSubscription(activeOrgId);
  const usage = useUsage(activeOrgId);
  const invoices = useInvoices(activeOrgId);
  const config = useBillingConfig(activeOrgId);
  const subscribe = useSubscribe(activeOrgId ?? '');
  const checkout = useCheckout(activeOrgId ?? '');
  const portal = usePortal(activeOrgId ?? '');
  const closeInvoice = useCloseInvoice(activeOrgId ?? '');
  const confirm = useConfirm();

  const paymentsEnabled = !!config.data?.paymentsEnabled;
  const canChangePlan = roleAtLeast(activeOrg?.role, Role.OWNER);
  const canCloseInvoice = roleAtLeast(activeOrg?.role, Role.ADMIN);
  const busy = subscribe.isPending || checkout.isPending;

  // On return from Stripe Checkout: confirm the session (so it works without the
  // webhook/CLI locally) or report cancellation, then clean the URL.
  useEffect(() => {
    const status = params.get('checkout');
    const sessionId = params.get('session_id');
    if (!status || !activeOrgId) return;

    if (status === 'success' && sessionId) {
      confirmCheckout(activeOrgId, sessionId)
        .then(() => {
          toast.success('Subscription active — payment received.');
          queryClient.invalidateQueries({ queryKey: billingKeys.subscription(activeOrgId) });
          queryClient.invalidateQueries({ queryKey: billingKeys.usage(activeOrgId) });
          queryClient.invalidateQueries({ queryKey: billingKeys.invoices(activeOrgId) });
        })
        .catch((err) => toast.error(getApiErrorMessage(err, 'Could not confirm payment')));
    } else if (status === 'cancel') {
      toast('Checkout canceled — no changes made.');
    }
    setParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOrgId]);

  async function handleSubscribe(plan: Plan, name: string) {
    const ok = await confirm({
      title: `Switch to the ${name} plan?`,
      description: `${activeOrg?.name ?? 'This organization'} will be moved to the ${name} plan.`,
      confirmLabel: `Switch to ${name}`,
    });
    if (!ok) return;
    try {
      if (paymentsEnabled) {
        const res = await checkout.mutateAsync(plan);
        if (res.url) {
          window.open(res.url, '_blank', 'noopener,noreferrer'); // Stripe Checkout in a new tab
          return;
        }
        toast.success(`Switched to the ${name} plan`); // FREE downgrade
      } else {
        // No Stripe configured → instant plan change (metering-only mode).
        await subscribe.mutateAsync(plan);
        toast.success(`Switched to the ${name} plan`);
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not change plan'));
    }
  }

  async function handleManageBilling() {
    try {
      const { url } = await portal.mutateAsync();
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not open billing portal'));
    }
  }

  async function handleCloseInvoice() {
    const ok = await confirm({
      title: 'Close the current billing period?',
      description: 'This finalizes usage so far into an invoice. This cannot be undone.',
      confirmLabel: 'Close period',
    });
    if (!ok) return;
    try {
      await closeInvoice.mutateAsync();
      toast.success('Invoice created for the current period');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not close invoice'));
    }
  }

  if (!activeOrgId) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-semibold tracking-tight">Billing</h1>
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-20 text-center text-muted-foreground">
          <CreditCard className="size-8" />
          <p>Loading your workspace…</p>
        </div>
      </div>
    );
  }

  // Publishers don't subscribe to a plan — they earn from subscriptions and the
  // platform takes a commission. No Free/Pro/Enterprise tiers here.
  if (isPublisher) {
    const e = earnings.data;
    return (
      <div>
        <PageHeader title="Billing" description="How you earn on the platform." />
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Earnings</CardTitle>
            <CardDescription>
              You earn from subscriptions to your APIs. The platform takes a{' '}
              {e?.platformFeePercent ?? 10}% commission — there's no monthly plan to pay.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {earnings.isLoading && <Skeleton className="h-28 w-full" />}
            {e && (
              <>
                <Metric label="Active subscribers" value={String(e.totalSubscribers)} />
                {/* Monthly statement — shows clearly that the fee is deducted. */}
                <div className="max-w-xs space-y-1.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Gross (subscriptions)</span>
                    <span className="font-mono tabular-nums">{formatCurrency(e.grossMonthly)}</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Platform fee ({e.platformFeePercent}%)</span>
                    <span className="font-mono tabular-nums">− {formatCurrency(e.platformFee)}</span>
                  </div>
                  <div className="flex items-center justify-between border-t pt-1.5 font-medium">
                    <span>You receive / month</span>
                    <span className="font-mono tabular-nums text-base">{formatCurrency(e.netMonthly)}</span>
                  </div>
                </div>
              </>
            )}
            <Link to="/payouts" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
              Manage payouts & per-API breakdown
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const u = usage.data;
  const usedPct =
    u && u.includedRequests > 0 ? Math.min(100, (u.usedRequests / u.includedRequests) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Billing</h1>
        <p className="text-muted-foreground">
          Plan, usage, and invoices for {activeOrg?.name ?? 'this organization'}.
        </p>
      </div>

      {/* Current usage / projected bill */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Current period</CardTitle>
            {sub.data && <Badge>{PLAN_LABELS[sub.data.plan]}</Badge>}
          </div>
          {sub.data && (
            <CardDescription>
              {formatDate(sub.data.currentPeriodStart)} – {formatDate(sub.data.currentPeriodEnd)}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {usage.isLoading && <Skeleton className="h-24 w-full" />}
          {usage.isError && (
            <p className="text-sm text-destructive">
              {getApiErrorMessage(usage.error, 'Could not load usage')}
            </p>
          )}
          {u && (
            <>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Requests used</span>
                  <span className="tabular-nums">
                    {formatNumber(u.usedRequests)} / {formatNumber(u.includedRequests)}
                  </span>
                </div>
                <Progress value={usedPct} />
                {u.overageRequests > 0 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    {formatNumber(u.overageRequests)} requests over the included quota.
                  </p>
                )}
              </div>
              <div className="grid grid-cols-3 gap-4 border-t pt-4">
                <Metric label="Base" value={formatCurrency(u.baseCost)} />
                <Metric label="Overage" value={formatCurrency(u.overageCost)} />
                <Metric label="Projected total" value={formatCurrency(u.totalCost)} emphasis />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Plan picker */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Plans</h2>
          {paymentsEnabled && canChangePlan && sub.data?.plan !== 'free' && (
            <Button variant="outline" size="sm" onClick={handleManageBilling} disabled={portal.isPending}>
              <CardIcon className="size-4" />
              Manage billing
            </Button>
          )}
        </div>
        {paymentsEnabled ? (
          <p className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <ExternalLink className="size-3" />
            Paid plans are charged securely via Stripe.
          </p>
        ) : (
          <p className="mb-3 text-xs text-muted-foreground">
            Demo mode — plan changes apply instantly without payment.
          </p>
        )}
        <div className="grid gap-4 md:grid-cols-3">
          {PLAN_CATALOG.map((p) => {
            const isCurrent = sub.data?.plan === p.plan;
            return (
              <Card
                key={p.plan}
                className={cn(
                  'transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5',
                  isCurrent && 'border-primary ring-1 ring-primary glow-primary',
                )}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{p.name}</CardTitle>
                    {isCurrent && (
                      <Badge variant="secondary">
                        <Check className="size-3" /> Current
                      </Badge>
                    )}
                  </div>
                  <CardDescription>{p.tagline}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xl font-semibold tracking-tight">
                    {formatCurrency(p.pricePerMonth)}
                    <span className="text-sm font-normal text-muted-foreground">/mo</span>
                  </p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>{formatNumber(p.monthlyQuota)} requests / month</li>
                    <li>{formatNumber(p.requestsPerMinute)} req / minute</li>
                    <li>
                      {p.overagePerThousand > 0
                        ? `${formatCurrency(p.overagePerThousand)} per 1k overage`
                        : 'No overage billing'}
                    </li>
                  </ul>
                  {canChangePlan && !isCurrent && (
                    <Button
                      className="w-full"
                      variant={p.plan === 'free' ? 'outline' : 'default'}
                      disabled={busy}
                      onClick={() => handleSubscribe(p.plan, p.name)}
                    >
                      {p.plan === 'free'
                        ? 'Downgrade to Free'
                        : paymentsEnabled
                          ? `Upgrade to ${p.name}`
                          : `Switch to ${p.name}`}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
        {!canChangePlan && (
          <p className="mt-2 text-xs text-muted-foreground">
            Only an organization owner can change the plan.
          </p>
        )}
      </div>

      {/* Invoices */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Invoices</CardTitle>
            {canCloseInvoice && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleCloseInvoice}
                disabled={closeInvoice.isPending}
              >
                Close current period
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {invoices.isLoading && <Skeleton className="h-24 w-full" />}
          {invoices.data && invoices.data.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">No invoices yet.</p>
          )}
          {invoices.data && invoices.data.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead className="text-right">Used</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.data.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell>
                      {formatDate(inv.periodStart)} – {formatDate(inv.periodEnd)}
                    </TableCell>
                    <TableCell>{PLAN_LABELS[inv.plan]}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(Number(inv.usedRequests))}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(Number(inv.totalCost))}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{inv.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          'font-mono tabular-nums tracking-tight',
          emphasis ? 'text-xl font-semibold' : 'text-base font-medium',
        )}
      >
        {value}
      </p>
    </div>
  );
}
