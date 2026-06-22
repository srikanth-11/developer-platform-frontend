import { useEffect } from 'react';
import { BadgeCheck, Link as LinkIcon, Wallet } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useActiveOrg } from '@/features/organizations/active-org-context';
import { getApiErrorMessage } from '@/lib/api';
import { Role, roleAtLeast } from '@/lib/enums';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';
import { marketplaceKeys, useConnectOnboard, useConnectStatus, useEarnings } from './hooks';

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

/** Publisher dashboard: Stripe Connect payout setup + status. */
export function PayoutsPage() {
  const { activeOrgId } = useActiveOrg();
  const { activeOrg } = useActiveOrg();
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();
  const connect = useConnectStatus(activeOrgId);
  const onboard = useConnectOnboard(activeOrgId ?? '');
  const earnings = useEarnings(activeOrgId);
  const canOnboard = roleAtLeast(activeOrg?.role, Role.ADMIN);

  // Handle return from Stripe Connect onboarding.
  useEffect(() => {
    if (!activeOrgId) return;
    const connectReturn = params.get('connect');
    if (connectReturn === 'done') {
      toast.success('Payout setup updated.');
      queryClient.invalidateQueries({ queryKey: marketplaceKeys.connect(activeOrgId) });
    } else if (connectReturn === 'refresh') {
      toast('Payout setup was interrupted — you can resume anytime.');
    }
    if (connectReturn) setParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOrgId]);

  async function handleOnboard() {
    try {
      const { url } = await onboard.mutateAsync();
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not start payout setup'));
    }
  }

  if (!activeOrgId) {
    return (
      <div>
        <PageHeader title="Payouts" />
        <p className="text-sm text-muted-foreground">Loading your workspace…</p>
      </div>
    );
  }

  const ready = connect.data?.payoutsReady;

  return (
    <div className="max-w-2xl">
      <PageHeader title="Payouts" description="Get paid when other teams subscribe to your APIs." />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Payout account</CardTitle>
            {connect.isLoading ? (
              <Skeleton className="h-5 w-20" />
            ) : ready ? (
              <span className="inline-flex items-center gap-1.5 text-sm text-success">
                <BadgeCheck className="size-4" /> Enabled
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">Not set up</span>
            )}
          </div>
          <CardDescription>
            Payouts are handled by Stripe. Subscribers’ payments go to your Stripe account, minus a
            10% platform fee. Your APIs can’t be subscribed to until this is set up.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {connect.isError && (
            <p className="text-sm text-destructive">
              {getApiErrorMessage(connect.error, 'Could not load payout status')}
            </p>
          )}

          {ready ? (
            <div className="flex items-start gap-2 rounded-md border border-success/30 bg-success/5 p-3 text-sm">
              <BadgeCheck className="mt-0.5 size-4 shrink-0 text-success" />
              <span>Your account can accept payments. Published paid APIs are now subscribable.</span>
            </div>
          ) : (
            <div className="flex items-start gap-2 rounded-md border border-dashed p-3 text-sm text-muted-foreground">
              <Wallet className="mt-0.5 size-4 shrink-0" />
              <span>
                Complete Stripe’s onboarding (business details + bank account) to start earning.
              </span>
            </div>
          )}

          {canOnboard ? (
            <Button onClick={handleOnboard} disabled={onboard.isPending}>
              <LinkIcon className="size-4" />
              {onboard.isPending
                ? 'Opening Stripe…'
                : ready
                  ? 'Manage payout account'
                  : connect.data?.connected
                    ? 'Finish payout setup'
                    : 'Set up payouts'}
            </Button>
          ) : (
            <p className="text-xs text-muted-foreground">Only an organization admin can set up payouts.</p>
          )}
        </CardContent>
      </Card>

      {/* Earnings */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Earnings</CardTitle>
          <CardDescription>
            Recurring revenue from active subscriptions to your APIs (after the{' '}
            {earnings.data?.platformFeePercent ?? 10}% platform fee).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {earnings.isLoading && <Skeleton className="h-24 w-full" />}
          {earnings.data && (
            <>
              <div className="grid grid-cols-3 gap-4">
                <Metric label="Subscribers" value={String(earnings.data.totalSubscribers)} />
                <Metric label="Gross / mo" value={formatCurrency(earnings.data.grossMonthly)} />
                <Metric label="Net / mo" value={formatCurrency(earnings.data.netMonthly)} emphasis />
              </div>
              {earnings.data.perApi.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>API</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Subscribers</TableHead>
                      <TableHead className="text-right">Net / mo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {earnings.data.perApi.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">{row.name}</TableCell>
                        <TableCell className="text-right font-mono text-xs tabular-nums">
                          {row.pricePerMonth > 0 ? `${formatCurrency(row.pricePerMonth)}/mo` : 'Free'}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{row.subscribers}</TableCell>
                        <TableCell className="text-right font-mono tabular-nums">
                          {formatCurrency(row.netMonthly)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {earnings.data.perApi.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No published APIs yet — earnings appear once teams subscribe to your APIs.
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {!connect.data?.connected && (
        <p className="mt-4 text-xs text-muted-foreground">
          Don’t have paid APIs yet? You can still{' '}
          <Link to="/my-apis" className={buttonVariants({ variant: 'link', size: 'sm' }) + ' h-auto p-0'}>
            publish free APIs
          </Link>{' '}
          without setting up payouts.
        </p>
      )}
    </div>
  );
}
