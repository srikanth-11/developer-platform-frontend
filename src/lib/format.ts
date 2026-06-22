/** Shared display formatters. */

/** ISO string -> short local date, or a dash for null/undefined. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** Compact number, e.g. 12_500 -> "12.5K". */
export function formatCompact(n: number): string {
  return new Intl.NumberFormat(undefined, { notation: 'compact' }).format(n);
}

/** Full number with grouping, e.g. 12500 -> "12,500". */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat().format(n);
}

/** USD currency, e.g. 49 -> "$49.00". */
export function formatCurrency(n: number): string {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(n);
}
