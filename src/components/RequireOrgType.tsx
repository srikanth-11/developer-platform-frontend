import { Outlet } from 'react-router-dom';
import { ArrowLeftRight } from 'lucide-react';
import { useActiveOrg } from '@/features/organizations/active-org-context';
import { ORG_TYPE_LABELS, type OrganizationType } from '@/lib/enums';

/**
 * Gates a section to one organization type. Publisher and subscriber dashboards
 * are distinct, so visiting the wrong section (e.g. a subscriber org opening
 * /my-apis) shows a switch prompt rather than a broken page.
 */
export function RequireOrgType({ type }: { type: OrganizationType }) {
  const { activeOrg } = useActiveOrg();

  if (activeOrg && activeOrg.type !== type) {
    return (
      <div className="flex min-h-60 flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-20 text-center text-muted-foreground">
        <ArrowLeftRight className="size-8" />
        <p>
          This area is for{' '}
          <span className="font-medium text-foreground">{ORG_TYPE_LABELS[type]}</span> accounts.
        </p>
        <p className="text-sm">
          Sign in with a {ORG_TYPE_LABELS[type].toLowerCase()} account to continue.
        </p>
      </div>
    );
  }

  return <Outlet />;
}
