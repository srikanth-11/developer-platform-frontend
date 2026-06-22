import { useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getApiErrorMessage } from '@/lib/api';
import { useCreateApiKey } from './hooks';
import type { CreatedApiKey } from './types';

/**
 * Collects a name + optional expiry, creates the key, and hands the resulting
 * plaintext secret to the parent (which shows it in the SecretRevealDialog).
 */
export function CreateApiKeyDialog({
  orgId,
  appId,
  onCreated,
}: {
  orgId: string;
  appId: string;
  onCreated: (key: CreatedApiKey) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [expiresInDays, setExpiresInDays] = useState('');
  const createKey = useCreateApiKey(orgId, appId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const created = await createKey.mutateAsync({
        name,
        // Empty field => non-expiring key (omit the property).
        expiresInDays: expiresInDays ? Number(expiresInDays) : undefined,
      });
      setName('');
      setExpiresInDays('');
      setOpen(false);
      onCreated(created); // parent opens the one-time reveal
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not create API key'));
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <Plus className="size-4" />
            New API key
          </Button>
        }
      />
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create API key</DialogTitle>
            <DialogDescription>
              The secret is shown once after creation. Store it somewhere safe.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="key-name">Name</Label>
              <Input
                id="key-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Production server"
                minLength={2}
                maxLength={100}
                required
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="key-expiry">Expires in (days, optional)</Label>
              <Input
                id="key-expiry"
                type="number"
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(e.target.value)}
                placeholder="Never"
                min={1}
                max={3650}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={createKey.isPending}>
              {createKey.isPending ? 'Creating…' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
