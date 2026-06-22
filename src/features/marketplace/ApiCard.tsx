import { Store } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getApiErrorMessage } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import type { MarketplaceApi } from './types';

/** A marketplace API summary card with an actions slot. */
export function ApiCard({ api, children }: { api: MarketplaceApi; children?: React.ReactNode }) {
  return (
    <Card className="flex flex-col transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{api.name}</CardTitle>
          {api.category && <Badge variant="outline">{api.category}</Badge>}
        </div>
        <CardDescription className="line-clamp-2">
          {api.description || 'No description.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="mt-auto flex items-center justify-between">
        <span className="font-mono text-xs text-muted-foreground">
          {api.pricePerMonth > 0 ? `${formatCurrency(api.pricePerMonth)}/mo` : 'Free'} · {api.version}
        </span>
        {children}
      </CardContent>
    </Card>
  );
}

export function CardGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}

export function CardGridSkeleton() {
  return (
    <CardGrid>
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-36 w-full rounded-xl" />
      ))}
    </CardGrid>
  );
}

export function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 text-center text-muted-foreground">
      <Store className="size-8" />
      <p>{children}</p>
    </div>
  );
}

export function ErrorBox({ error, fallback }: { error: unknown; fallback: string }) {
  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
      {getApiErrorMessage(error, fallback)}
    </div>
  );
}
