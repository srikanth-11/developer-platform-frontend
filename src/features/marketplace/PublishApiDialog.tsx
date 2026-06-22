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
import { Textarea } from '@/components/ui/textarea';
import { getApiErrorMessage } from '@/lib/api';
import { usePublishApi } from './hooks';

export function PublishApiDialog({ orgId }: { orgId: string }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    baseUrl: '',
    description: '',
    category: '',
    version: '',
    pricePerMonth: '',
  });
  const publish = usePublishApi(orgId);

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await publish.mutateAsync({
        name: form.name,
        baseUrl: form.baseUrl,
        description: form.description || undefined,
        category: form.category || undefined,
        version: form.version || undefined,
        pricePerMonth: form.pricePerMonth ? Number(form.pricePerMonth) : undefined,
      });
      toast.success(`Published “${form.name}”`);
      setForm({ name: '', baseUrl: '', description: '', category: '', version: '', pricePerMonth: '' });
      setOpen(false);
    } catch (error) {
      // A 403 here means the `api_marketplace` feature flag is off for this org.
      toast.error(getApiErrorMessage(error, 'Could not publish API'));
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <Plus className="size-4" />
            Publish API
          </Button>
        }
      />
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Publish an API</DialogTitle>
            <DialogDescription>List your API in the marketplace for others to subscribe.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="api-name">Name</Label>
              <Input id="api-name" value={form.name} onChange={update('name')} required minLength={2} maxLength={100} autoFocus />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="api-baseurl">Base URL</Label>
              <Input id="api-baseurl" type="url" value={form.baseUrl} onChange={update('baseUrl')} placeholder="https://api.example.com" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="api-desc">Description (optional)</Label>
              <Textarea id="api-desc" value={form.description} onChange={update('description')} maxLength={1000} rows={3} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="grid gap-2">
                <Label htmlFor="api-category">Category</Label>
                <Input id="api-category" value={form.category} onChange={update('category')} placeholder="Weather" maxLength={50} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="api-version">Version</Label>
                <Input id="api-version" value={form.version} onChange={update('version')} placeholder="v1" maxLength={20} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="api-price">$/month</Label>
                <Input id="api-price" type="number" value={form.pricePerMonth} onChange={update('pricePerMonth')} min={0} placeholder="0" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={publish.isPending}>
              {publish.isPending ? 'Publishing…' : 'Publish'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
