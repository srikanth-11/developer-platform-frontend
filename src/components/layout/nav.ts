import {
  BarChart3,
  BookOpen,
  CreditCard,
  KeyRound,
  LayoutDashboard,
  Store,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { OrganizationType } from '@/lib/enums';

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  end?: boolean;
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

const DASHBOARD: NavItem = { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, end: true };
const BILLING: NavItem = { label: 'Billing', to: '/billing', icon: CreditCard };
const DOCS: NavItem = { label: 'Developer Portal', to: '/developer-portal', icon: BookOpen };

/**
 * Navigation by org TYPE. There's no Organizations or Applications section — the
 * workspace is provisioned at signup, so users go straight to their APIs.
 */
const SUBSCRIBER_GROUPS: NavGroup[] = [
  { items: [DASHBOARD] },
  { label: 'APIs', items: [{ label: 'API Keys', to: '/api-keys', icon: KeyRound }] },
  {
    label: 'Insights',
    items: [{ label: 'Analytics', to: '/analytics', icon: BarChart3 }, BILLING],
  },
  { label: 'Marketplace', items: [{ label: 'Marketplace', to: '/marketplace', icon: Store }] },
  { label: 'Develop', items: [DOCS] },
];

const PUBLISHER_GROUPS: NavGroup[] = [
  { items: [DASHBOARD] },
  {
    label: 'Marketplace',
    items: [
      { label: 'My APIs', to: '/my-apis', icon: Store },
      { label: 'Payouts', to: '/payouts', icon: Wallet },
    ],
  },
  { label: 'Account', items: [BILLING] },
  { label: 'Develop', items: [DOCS] },
];

export function navGroupsForType(type: OrganizationType | undefined): NavGroup[] {
  return type === OrganizationType.PUBLISHER ? PUBLISHER_GROUPS : SUBSCRIBER_GROUPS;
}

/** Flat list for the given type (dashboard quick-links + page-title lookup). */
export function navItemsForType(type: OrganizationType | undefined): NavItem[] {
  return navGroupsForType(type).flatMap((g) => g.items);
}
