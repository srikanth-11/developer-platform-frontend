import { createContext, useContext } from 'react';

/** Options passed to `confirm()` to drive the modal. */
export type ConfirmOptions = {
  title: string;
  /** Body text shown under the title. */
  description?: string;
  /** Label for the confirming action. Defaults to "Confirm". */
  confirmLabel?: string;
  /** Label for the dismissing action. Defaults to "Cancel". */
  cancelLabel?: string;
  /** Use the destructive button style for irreversible actions. */
  destructive?: boolean;
};

/** Resolves to `true` when confirmed, `false` when cancelled/dismissed. */
export type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

export const ConfirmContext = createContext<ConfirmFn | null>(null);

/** Returns the `confirm()` function. Must be used under a `<ConfirmProvider>`. */
export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within a <ConfirmProvider>');
  return ctx;
}
