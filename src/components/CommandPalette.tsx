import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { BookOpen, KeyRound, LogOut, Moon, Store, Sun, Wallet } from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { navItemsForType } from '@/components/layout/nav';
import { useAuth } from '@/features/auth/auth-context';
import { useActiveOrg } from '@/features/organizations/active-org-context';
import { OrganizationType } from '@/lib/enums';

/** Any component can open the palette by dispatching this event (the topbar pill does). */
export const OPEN_COMMAND_PALETTE = 'commandpalette:open';

/**
 * ⌘K command palette — the keyboard-first way to move around and run actions.
 * Mounted once in the dashboard shell.
 */
export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { resolvedTheme, setTheme } = useTheme();
  const { logout } = useAuth();
  const { activeOrg } = useActiveOrg();

  const isPublisher = activeOrg?.type === OrganizationType.PUBLISHER;
  const navItems = navItemsForType(activeOrg?.type);

  // ⌘K / Ctrl+K toggles; a custom event lets the topbar pill open it too.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const onOpen = () => setOpen(true);
    document.addEventListener('keydown', onKey);
    window.addEventListener(OPEN_COMMAND_PALETTE, onOpen);
    return () => {
      document.removeEventListener('keydown', onKey);
      window.removeEventListener(OPEN_COMMAND_PALETTE, onOpen);
    };
  }, []);

  /** Run an action and close the palette. */
  const run = (fn: () => void) => () => {
    setOpen(false);
    fn();
  };

  const actions = isPublisher
    ? [
        { label: 'Publish an API', icon: Store, run: () => navigate('/my-apis') },
        { label: 'Set up payouts', icon: Wallet, run: () => navigate('/payouts') },
      ]
    : [
        { label: 'Create an API key', icon: KeyRound, run: () => navigate('/api-keys') },
        { label: 'Browse the marketplace', icon: Store, run: () => navigate('/marketplace') },
      ];

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search pages and actions…" />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>

        <CommandGroup heading="Go to">
          {navItems.map((item) => (
            <CommandItem key={item.to} onSelect={run(() => navigate(item.to))}>
              <item.icon className="size-4" />
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Actions">
          {actions.map((a) => (
            <CommandItem key={a.label} onSelect={run(a.run)}>
              <a.icon className="size-4" />
              {a.label}
            </CommandItem>
          ))}
          <CommandItem onSelect={run(() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark'))}>
            {resolvedTheme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
            Toggle theme
          </CommandItem>
          <CommandItem onSelect={run(() => navigate('/developer-portal'))}>
            <BookOpen className="size-4" />
            Open developer docs
          </CommandItem>
          <CommandItem onSelect={run(logout)}>
            <LogOut className="size-4" />
            Sign out
          </CommandItem>
        </CommandGroup>
      </CommandList>
      <div className="flex items-center justify-end gap-1 border-t px-3 py-2 text-[11px] text-muted-foreground">
        <CommandShortcut>↑↓ navigate · ↵ select · esc close</CommandShortcut>
      </div>
    </CommandDialog>
  );
}
