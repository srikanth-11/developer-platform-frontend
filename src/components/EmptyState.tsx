import type { LucideIcon } from 'lucide-react';

/**
 * A consistent, on-brand empty/loading state: an icon in a glowing halo, a
 * title, supporting copy, and an optional action. An empty screen is an
 * invitation to act, not dead space.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed py-16 text-center">
      <div className="relative flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <div className="absolute inset-0 rounded-full bg-primary/20 blur-md" />
        <Icon className="relative size-6" />
      </div>
      <div className="space-y-1">
        <p className="font-medium text-foreground">{title}</p>
        {description && <p className="mx-auto max-w-sm text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}
