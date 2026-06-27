import { Hexagon } from 'lucide-react';
import { LayoutGroup, motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { navGroupsForType } from './nav';
import type { OrganizationType } from '@/lib/enums';

interface SidebarContentProps {
  orgType: OrganizationType | undefined;
  /** Called after a nav link is activated (used to close the mobile drawer). */
  onNavigate?: () => void;
  /**
   * Disambiguates the shared-layout `layoutId` so the desktop sidebar and the
   * mobile drawer (both mounted in the DOM) don't fight over the active pill.
   */
  idSuffix?: string;
}

/**
 * The inner sidebar: brand, grouped navigation, and the status footer.
 * Shared by the persistent desktop sidebar and the mobile slide-in drawer so
 * navigation stays identical across breakpoints.
 */
export function SidebarContent({ orgType, onNavigate, idSuffix = 'desktop' }: SidebarContentProps) {
  const navGroups = navGroupsForType(orgType);

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 shrink-0 items-center gap-2.5 border-b px-5">
        <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground glow-primary">
          <Hexagon className="size-4" />
        </div>
        <span className="text-sm font-semibold tracking-tight">Developer Platform</span>
      </div>

      <LayoutGroup id={idSuffix}>
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
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      'group relative flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm transition-colors md:py-2',
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
                          layoutId={`active-nav-${idSuffix}`}
                          className="absolute inset-0 rounded-md bg-sidebar-accent"
                          transition={{ type: 'spring', stiffness: 520, damping: 42 }}
                        />
                      )}
                      <Icon
                        className={cn(
                          'relative z-10 size-4 transition-colors',
                          isActive
                            ? 'text-primary'
                            : 'text-muted-foreground group-hover:text-foreground',
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

      <div className="shrink-0 border-t px-5 py-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
            <span className="relative inline-flex size-1.5 rounded-full bg-success" />
          </span>
          All systems operational
        </div>
      </div>
    </div>
  );
}
