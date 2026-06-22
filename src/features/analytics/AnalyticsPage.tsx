import { useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Reveal, RevealItem } from '@/components/Reveal';
import { StatCard } from '@/components/StatCard';
import { useActiveOrg } from '@/features/organizations/active-org-context';
import { getApiErrorMessage } from '@/lib/api';
import { formatCompact, formatDate } from '@/lib/format';
import { useAnalyticsOverview } from './hooks';

const RANGES = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
];

const chartConfig = {
  total: { label: 'Requests', color: 'var(--chart-1)' },
  errors: { label: 'Errors', color: 'var(--chart-5)' },
} satisfies ChartConfig;

export function AnalyticsPage() {
  const { activeOrg, activeOrgId } = useActiveOrg();
  const [days, setDays] = useState('30');
  const { data, isLoading, isError, error } = useAnalyticsOverview(activeOrgId, Number(days));

  if (!activeOrgId) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-semibold tracking-tight">Analytics</h1>
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-20 text-center text-muted-foreground">
          <BarChart3 className="size-8" />
          <p>Loading your workspace…</p>
        </div>
      </div>
    );
  }

  const s = data?.summary;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Gateway traffic for {activeOrg?.name ?? 'this organization'}.
          </p>
        </div>
        <Select value={days} onValueChange={(v) => v && setDays(v)}>
          <SelectTrigger size="sm" className="min-w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RANGES.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {getApiErrorMessage(error, 'Could not load analytics')}
        </div>
      )}

      {isLoading && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-72 w-full rounded-xl" />
        </>
      )}

      {s && (
        <>
          {/* Stat cards */}
          <Reveal stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <RevealItem>
              <StatCard label="Total requests" value={s.totalRequests} format={formatCompact} accent />
            </RevealItem>
            <RevealItem>
              <StatCard
                label="Error rate"
                value={s.errorRate * 100}
                format={(n) => `${n.toFixed(1)}%`}
                hint={`${formatCompact(s.failedRequests)} failed`}
              />
            </RevealItem>
            <RevealItem>
              <StatCard label="Avg latency" value={s.avgResponseMs} format={(n) => `${Math.round(n)} ms`} />
            </RevealItem>
            <RevealItem>
              <StatCard
                label="p95 latency"
                value={s.p95ResponseMs}
                format={(n) => `${Math.round(n)} ms`}
                hint={`max ${s.maxResponseMs} ms`}
              />
            </RevealItem>
          </Reveal>

          {/* Daily traffic chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Requests over time</CardTitle>
            </CardHeader>
            <CardContent>
              {data && data.daily.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-72 w-full">
                  <AreaChart data={data.daily} margin={{ left: 4, right: 12, top: 8 }}>
                    <defs>
                      <linearGradient id="fillTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-total)" stopOpacity={0.5} />
                        <stop offset="95%" stopColor="var(--color-total)" stopOpacity={0.04} />
                      </linearGradient>
                      <linearGradient id="fillErrors" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-errors)" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="var(--color-errors)" stopOpacity={0.03} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="day"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      minTickGap={24}
                      tickFormatter={(v: string) => formatDate(v)}
                    />
                    <YAxis tickLine={false} axisLine={false} width={36} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      dataKey="total"
                      type="monotone"
                      stroke="var(--color-total)"
                      strokeWidth={2}
                      fill="url(#fillTotal)"
                      animationDuration={900}
                    />
                    <Area
                      dataKey="errors"
                      type="monotone"
                      stroke="var(--color-errors)"
                      strokeWidth={2}
                      fill="url(#fillErrors)"
                      animationDuration={900}
                    />
                  </AreaChart>
                </ChartContainer>
              ) : (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  No traffic in this period yet. Once your API keys make gateway requests,
                  usage will show up here.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Top endpoints */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top endpoints</CardTitle>
            </CardHeader>
            <CardContent>
              {data && data.topEndpoints.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Endpoint</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead className="text-right">Requests</TableHead>
                      <TableHead className="text-right">Avg ms</TableHead>
                      <TableHead className="text-right">Errors</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.topEndpoints.map((e) => (
                      <TableRow key={`${e.method} ${e.endpoint}`}>
                        <TableCell className="font-mono text-xs">{e.endpoint}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{e.method}</Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCompact(e.count)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{e.avgResponseMs}</TableCell>
                        <TableCell className="text-right tabular-nums">{e.errors}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">No endpoint data yet.</p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
