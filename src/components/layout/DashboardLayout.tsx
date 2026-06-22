import { ChevronDown, Hexagon, LogOut, Search } from 'lucide-react';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CommandPalette, OPEN_COMMAND_PALETTE } from '@/components/CommandPalette';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/features/auth/auth-context';
import { useActiveOrg } from '@/features/organizations/active-org-context';
import { ORG_TYPE_LABELS } from '@/lib/enums';
import { cn } from '@/lib/utils';
import { navGroupsForType } from './nav';

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const { activeOrg } = useActiveOrg();
  const navigate = useNavigate();
  const location = useLocation();
  const navGroups = navGroupsForType(activeOrg?.type);

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || '';
  const initials = (
    [user?.firstName, user?.lastName].filter(Boolean).map((s) => s![0]).join('') ||
    user?.email?.[0] ||
    '?'
  ).toUpperCase();

  const openPalette = () => window.dispatchEvent(new Event(OPEN_COMMAND_PALETTE));

  return (
    <div className="flex min-h-svh bg-background">
      <CommandPalette />

      {/* ---- Sidebar ---- */}
      <aside className="hidden w-64 shrink-0 flex-col border-r bg-sidebar md:flex">
        <div className="flex h-14 items-center gap-2.5 border-b px-5">
          <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground glow-primary">
            <Hexagon className="size-4" />
          </div>
          <span className="text-sm font-semibold tracking-tight">Developer Platform</span>
        </div>

        <LayoutGroup>
          <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-4">
            {navGroups.map((group, i) => (
              <div key={group.label ?? i} className="flex flex-col gap-1">
                {group.label && (
                  <p className="px-3 pb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
                    {group.label}
                  </p>
                )}
                {group.items.map(({ label, to, icon: Icon, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      cn(
                        'group relative flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors',
                        isActive
                          ? 'font-medium text-sidebar-accent-foreground'
                          : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <motion.span
                            layoutId="active-nav"
                            className="absolute inset-0 rounded-md bg-sidebar-accent"
                            transition={{ type: 'spring', stiffness: 520, damping: 42 }}
                          />
                        )}
                        <Icon
                          className={cn(
                            'relative z-10 size-4 transition-colors',
                            isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground',
                          )}
                        />
                        <span className="relative z-10">{label}</span>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            ))}
          </nav>
        </LayoutGroup>

        <div className="border-t px-5 py-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
              <span className="relative inline-flex size-1.5 rounded-full bg-success" />
            </span>
            All systems operational
          </div>
        </div>
      </aside>

      {/* ---- Main column ---- */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/70 px-4 backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-2 md:hidden">
            <div className="flex size-6 items-center justify-center rounded bg-primary text-primary-foreground">
              <Hexagon className="size-3.5" />
            </div>
          </div>
          {activeOrg && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{activeOrg.name}</span>
              <Badge variant={activeOrg.type === 'publisher' ? 'default' : 'secondary'}>
                {ORG_TYPE_LABELS[activeOrg.type]}
              </Badge>
            </div>
          )}

          <div className="ml-auto flex items-center gap-2">
            {/* ⌘K launcher */}
            <button
              onClick={openPalette}
              className="hidden items-center gap-2 rounded-md border bg-muted/40 px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:flex"
            >
              <Search className="size-3.5" />
              <span>Search…</span>
              <kbd className="ml-2 rounded border bg-background px-1.5 font-mono text-[10px]">⌘K</kbd>
            </button>
            <ThemeToggle />
            <div className="mx-0.5 h-5 w-px bg-border" />

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button className="flex items-center gap-2 rounded-md py-1 pl-1 pr-1.5 transition-colors hover:bg-accent/60">
                    <span className="flex size-7 items-center justify-center rounded-full bg-primary/15 text-xs font-medium text-primary">
                      {initials}
                    </span>
                    <span className="hidden max-w-32 truncate text-sm text-muted-foreground sm:inline">
                      {displayName}
                    </span>
                    <ChevronDown className="size-3.5 text-muted-foreground" />
                  </button>
                }
              />
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex flex-col px-2 py-1.5">
                  <span className="text-sm font-medium text-foreground">{displayName}</span>
                  <span className="text-xs text-muted-foreground">{user?.email}</span>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/developer-portal')}>
                  Developer docs
                </DropdownMenuItem>
                <DropdownMenuItem onClick={openPalette}>Command palette ⌘K</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={logout}>
                  <LogOut className="size-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-6xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
