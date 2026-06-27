import { useCallback, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ConfirmContext, type ConfirmFn, type ConfirmOptions } from './confirm-context';

type ConfirmState = ConfirmOptions & { open: boolean };

/**
 * Provides a promise-based `confirm()` so any component can replace the native
 * `window.confirm()` with an in-app modal:
 *
 *   const confirm = useConfirm();
 *   if (!(await confirm({ title: 'Delete?', destructive: true }))) return;
 */
export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ConfirmState>({ open: false, title: '' });
  // Holds the pending promise's resolver between open and close.
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((options) => {
    setState({ ...options, open: true });
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const settle = useCallback((result: boolean) => {
    resolver.current?.(result);
    resolver.current = null;
    setState((prev) => ({ ...prev, open: false }));
  }, []);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog
        open={state.open}
        // Closing via backdrop / escape / X counts as a cancel.
        onOpenChange={(open) => {
          if (!open) settle(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{state.title}</DialogTitle>
            {state.description && <DialogDescription>{state.description}</DialogDescription>}
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => settle(false)}>
              {state.cancelLabel ?? 'Cancel'}
            </Button>
            <Button
              variant={state.destructive ? 'destructive' : 'default'}
              onClick={() => settle(true)}
            >
              {state.confirmLabel ?? 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  );
}
