import { useState } from 'react';
import { KeyRound, RefreshCw, Ban } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useConfirm } from '@/components/confirm-context';
import { useApplications } from '@/features/applications/hooks';
import { useActiveOrg } from '@/features/organizations/active-org-context';
import { getApiErrorMessage } from '@/lib/api';
import { Role, roleAtLeast } from '@/lib/enums';
import { formatCompact, formatDate } from '@/lib/format';
import { CreateApiKeyDialog } from './CreateApiKeyDialog';
import { SecretRevealDialog } from './SecretRevealDialog';
import { useApiKeys, useRevokeApiKey, useRotateApiKey } from './hooks';
import type { ApiKeyStatus, CreatedApiKey } from './types';

const STATUS_VARIANT: Record<ApiKeyStatus, 'success' | 'secondary' | 'warning'> = {
  active: 'success',
  revoked: 'secondary',
  expired: 'warning',
};

export function ApiKeysPage() {
  const { activeOrg, activeOrgId } = useActiveOrg();
  const { data: apps, isLoading: appsLoading } = useApplications(activeOrgId);

  // API keys live under the workspace's single default application.
  const effectiveAppId = apps?.[0]?.id ?? null;

  const { data: keys, isLoading, isError, error } = useApiKeys(activeOrgId, effectiveAppId);
  const revoke = useRevokeApiKey(activeOrgId ?? '', effectiveAppId ?? '');
  const rotate = useRotateApiKey(activeOrgId ?? '', effectiveAppId ?? '');
  const [revealed, setRevealed] = useState<CreatedApiKey | null>(null);
  const confirm = useConfirm();

  const canManage = roleAtLeast(activeOrg?.role, Role.DEVELOPER);

  async function handleRevoke(id: string, name: string) {
    const ok = await confirm({
      title: `Revoke key “${name}”?`,
      description: 'Clients using it will stop working immediately.',
      confirmLabel: 'Revoke key',
      destructive: true,
    });
    if (!ok) return;
    try {
      await revoke.mutateAsync(id);
      toast.success(`Key “${name}” revoked`);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not revoke key'));
    }
  }

  async function handleRotate(id: string, name: string) {
    const ok = await confirm({
      title: `Rotate key “${name}”?`,
      description: 'The current secret stops working immediately and a new one is issued.',
      confirmLabel: 'Rotate key',
      destructive: true,
    });
    if (!ok) return;
    try {
      const created = await rotate.mutateAsync(id);
      setRevealed(created);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not rotate key'));
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="API Keys" description="Credentials your apps use to call the gateway.">
        {canManage && activeOrgId && effectiveAppId && (
          <CreateApiKeyDialog orgId={activeOrgId} appId={effectiveAppId} onCreated={setRevealed} />
        )}
      </PageHeader>

      {(isLoading || appsLoading) && <Skeleton className="h-48 w-full rounded-xl" />}

      {isError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {getApiErrorMessage(error, 'Could not load API keys')}
        </div>
      )}

      {keys && keys.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-20 text-center text-muted-foreground">
          <KeyRound className="size-8" />
          <p>No API keys yet{canManage ? '. Create one to get started.' : '.'}</p>
        </div>
      )}

      {keys && keys.length > 0 && (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Usage</TableHead>
                <TableHead>Last used</TableHead>
                <TableHead>Expires</TableHead>
                {canManage && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {keys.map((key) => (
                <TableRow key={key.id}>
                  <TableCell className="font-medium">{key.name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {key.maskedKey}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[key.status]}>{key.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCompact(key.usageCount)}
                  </TableCell>
                  <TableCell>{formatDate(key.lastUsedAt)}</TableCell>
                  <TableCell>{formatDate(key.expiresAt)}</TableCell>
                  {canManage && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRotate(key.id, key.name)}
                          disabled={key.status !== 'active' || rotate.isPending}
                        >
                          <RefreshCw className="size-4" />
                          Rotate
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => handleRevoke(key.id, key.name)}
                          disabled={key.status !== 'active' || revoke.isPending}
                        >
                          <Ban className="size-4" />
                          Revoke
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <SecretRevealDialog created={revealed} onClose={() => setRevealed(null)} />
    </div>
  );
}
