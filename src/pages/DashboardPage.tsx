import { ArrowRight, KeyRound, Store, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Reveal, RevealItem } from '@/components/Reveal';
import { StatCard } from '@/components/StatCard';
import { navItemsForType } from '@/components/layout/nav';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { useAnalyticsOverview } from '@/features/analytics/hooks';
import { useAuth } from '@/features/auth/auth-context';
import { useActiveOrg } from '@/features/organizations/active-org-context';
import { useConnectStatus, useEarnings } from '@/features/marketplace/hooks';
import { OrganizationType } from '@/lib/enums';
import { formatCompact, formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';

export function DashboardPage() {
  const { user } = useAuth();
  const { activeOrg, activeOrgId } = useActiveOrg();
  const isPublisher = activeOrg?.type === OrganizationType.PUBLISHER;

  const analytics = useAnalyticsOverview(isPublisher ? null : activeOrgId, 30);
  const earnings = useEarnings(isPublisher ? activeOrgId : null);
  const connect = useConnectStatus(isPublisher ? activeOrgId : null);
  const firstName = user?.firstName || user?.email?.split('@')[0];
  const payoutSetupPending = isPublisher && connect.data && !connect.data.payoutsReady;

  const s = analytics.data?.summary;
  const e = earnings.data;
  const pct = (n: number) => `${n.toFixed(1)}%`;
  const ms = (n: number) => `${Math.round(n)} ms`;

  const stats = isPublisher
    ? [
        { label: 'Published APIs', value: e?.publishedApis ?? 0, loading: earnings.isLoading },
        { label: 'Subscribers', value: e?.totalSubscribers ?? 0, loading: earnings.isLoading },
        { label: 'Gross · mo', value: e?.grossMonthly ?? 0, format: formatCurrency, loading: earnings.isLoading },
        { label: 'Net · mo', value: e?.netMonthly ?? 0, format: formatCurrency, loading: earnings.isLoading, accent: true },
      ]
    : [
        { label: 'Requests · 30d', value: s?.totalRequests ?? 0, format: formatCompact, loading: analytics.isLoading, accent: true },
        { label: 'Error rate', value: (s?.errorRate ?? 0) * 100, format: pct, loading: analytics.isLoading },
        { label: 'Avg latency', value: s?.avgResponseMs ?? 0, format: ms, loading: analytics.isLoading },
        { label: 'p95 latency', value: s?.p95ResponseMs ?? 0, format: ms, loading: analytics.isLoading },
      ];

  const primaryCta = isPublisher
    ? { to: '/my-apis', label: 'Publish an API', icon: Store }
    : { to: '/api-keys', label: 'Create an API key', icon: KeyRound };

  return (
    <div>
      {/* Hero */}
      <Reveal>
        <div className="relative overflow-hidden rounded-2xl border bg-aurora p-6 sm:p-8">
          <div className="bg-grid pointer-events-none absolute inset-0" />
          <div className="relative max-w-2xl">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {activeOrg?.name ?? 'Your workspace'}
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
              Welcome back{firstName ? `, ${firstName}` : ''}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {isPublisher
                ? 'Track subscribers and earnings from your published APIs.'
                : 'Monitor your gateway traffic, keys, and subscriptions.'}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Link to={primaryCta.to} className={buttonVariants()}>
                <primaryCta.icon className="size-4" />
                {primaryCta.label}
              </Link>
              <button
                onClick={() => window.dispatchEvent(new Event('commandpalette:open'))}
                className={cn(buttonVariants({ variant: 'outline' }))}
              >
                Quick search
                <kbd className="ml-1 rounded border bg-background/60 px-1.5 font-mono text-[10px]">⌘K</kbd>
              </button>
            </div>
          </div>
        </div>
      </Reveal>

      {/* Payout setup (publishers) */}
      {payoutSetupPending && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3">
          <div className="flex items-center gap-2.5 text-sm">
            <Wallet className="size-4 shrink-0 text-warning-foreground" />
            <span>
              Finish setting up payouts to start earning from your APIs.
              <span className="text-muted-foreground"> Paid APIs can’t be subscribed to until then.</span>
            </span>
          </div>
          <Link to="/payouts" className={buttonVariants({ size: 'sm' })}>
            Set up payouts
          </Link>
        </div>
      )}

      {/* Metric band */}
      <Reveal stagger className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <RevealItem key={stat.label}>
            <StatCard {...stat} />
          </RevealItem>
        ))}
      </Reveal>

      {/* Quick links */}
      <h2 className="mb-3 mt-8 text-sm font-medium text-muted-foreground">Jump to</h2>
      <Reveal stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {navItemsForType(activeOrg?.type)
          .filter((item) => item.to !== '/')
          .map(({ label, to, icon: Icon }) => (
            <RevealItem key={to}>
              <Link to={to} className="group block">
                <Card className="h-full transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex size-9 items-center justify-center rounded-md border bg-muted/40 text-muted-foreground transition-colors group-hover:text-primary">
                        <Icon className="size-4.5" />
                      </div>
                      <ArrowRight className="size-4 -translate-x-1 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                    </div>
                    <CardTitle className="mt-2 text-base">{label}</CardTitle>
                  </CardHeader>
                </Card>
              </Link>
            </RevealItem>
          ))}
      </Reveal>
    </div>
  );
}
