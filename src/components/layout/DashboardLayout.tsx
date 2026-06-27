import { useEffect, useState } from 'react';
import { ChevronDown, LogOut, Menu, Search } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { CommandPalette, OPEN_COMMAND_PALETTE } from '@/components/CommandPalette';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/features/auth/auth-context';
import { useActiveOrg } from '@/features/organizations/active-org-context';
import { ORG_TYPE_LABELS } from '@/lib/enums';
import { SidebarContent } from './SidebarContent';

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const { activeOrg } = useActiveOrg();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

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

      {/* ---- Sidebar (persistent on desktop) ---- */}
      <aside className="hidden w-64 shrink-0 border-r bg-sidebar md:block">
        <SidebarContent orgType={activeOrg?.type} idSuffix="desktop" />
      </aside>

      {/* ---- Sidebar (slide-in drawer on mobile) ---- */}
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarContent
            orgType={activeOrg?.type}
            idSuffix="mobile"
            onNavigate={() => setMobileNavOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* ---- Main column ---- */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/70 px-4 backdrop-blur-md sm:px-6">
          {/* Mobile: hamburger opens the navigation drawer. */}
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open navigation menu"
            className="-ml-1.5 flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground md:hidden"
          >
            <Menu className="size-5" />
          </button>
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
