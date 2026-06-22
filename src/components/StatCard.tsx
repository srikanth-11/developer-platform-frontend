import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCountUp } from '@/lib/motion';
import { cn } from '@/lib/utils';

/**
 * A headline metric with an animated count-up value. Pass a numeric `value` and
 * an optional `format` (e.g. currency, compact, "ms"). `accent` adds a soft
 * brand glow for the hero metric.
 */
export function StatCard({
  label,
  value,
  format = (n) => Math.round(n).toLocaleString(),
  hint,
  icon: Icon,
  loading = false,
  accent = false,
}: {
  label: string;
  value: number;
  format?: (n: number) => string;
  hint?: string;
  icon?: LucideIcon;
  loading?: boolean;
  accent?: boolean;
}) {
  const n = useCountUp(value);

  return (
    <Card className={cn('relative overflow-hidden', accent && 'ring-1 ring-primary/25')}>
      {accent && (
        <div className="pointer-events-none absolute -right-10 -top-10 size-28 rounded-full bg-primary/15 blur-2xl" />
      )}
      <CardContent className="relative space-y-1 p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          {Icon && <Icon className="size-4 text-muted-foreground/70" />}
        </div>
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <p className="font-mono text-2xl font-semibold tracking-tight tabular-nums">{format(n)}</p>
        )}
        {hint && !loading && <p className="text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}
