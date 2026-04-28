import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import GlobalSearchModal, { isSearchShortcut } from './GlobalSearchModal';
import {
  LayoutDashboard,
  LineChart,
  Users,
  Wallet2,
  Zap,
  Puzzle,
  Plug,
  type LucideIcon,
} from 'lucide-react';
import { useFinanceData } from '../context/FinanceDataContext';
import type { InstalledPlugin } from '../types/plugins';

const SIDEBAR_COLLAPSED_KEY = 'ff_sidebar_collapsed_v1';
/** Sticks below the sticky app header (min-h-[4.5rem]). */
const sidebarSticky = 'md:sticky md:top-[4.5rem]';

const coreNav: {
  to: string;
  label: string;
  icon: LucideIcon;
  end: boolean;
}[] = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/analytics', label: 'Cash & analytics', icon: LineChart, end: false },
  { to: '/budget', label: 'Budget & cash flow', icon: Wallet2, end: false },
  { to: '/contacts', label: 'Clients & suppliers', icon: Users, end: false },
  { to: '/activity', label: 'Transactions & alerts', icon: Zap, end: false },
];

function useDelayedTooltip(active: boolean) {
  const [open, setOpen] = useState(false);
  const tRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onEnter = useCallback(() => {
    if (!active) return;
    if (tRef.current) clearTimeout(tRef.current);
    tRef.current = setTimeout(() => {
      tRef.current = null;
      setOpen(true);
    }, 500);
  }, [active]);

  const onLeave = useCallback(() => {
    if (tRef.current) {
      clearTimeout(tRef.current);
      tRef.current = null;
    }
    setOpen(false);
  }, []);

  useEffect(
    () => () => {
      if (tRef.current) clearTimeout(tRef.current);
    },
    []
  );

  return { open, onEnter, onLeave };
}

function SidebarItemTooltip({
  label,
  collapsed,
  children,
}: {
  label: string;
  collapsed: boolean;
  children: ReactNode;
}) {
  const { open, onEnter, onLeave } = useDelayedTooltip(collapsed);

  return (
    <div className="relative" onMouseEnter={onEnter} onMouseLeave={onLeave}>
      {children}
      {collapsed && open && (
        <div
          role="tooltip"
          className="absolute left-full top-1/2 z-[60] ml-2 -translate-y-1/2 whitespace-nowrap rounded-xl bg-ink-black px-3 py-2 text-xs font-medium text-canvas-cream shadow-lg pointer-events-none"
        >
          {label}
        </div>
      )}
    </div>
  );
}

function mobileTabClass({ isActive }: { isActive: boolean }) {
  return [
    'shrink-0 rounded-full px-3 py-2 text-xs font-medium no-underline max-w-[140px] truncate',
    isActive ? 'bg-ink-black text-canvas-cream' : 'text-ink-black/70',
  ].join(' ');
}

export default function AppLayout() {
  const { plugins, isPluginEnabled } = useFinanceData();
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isSearchShortcut(e)) {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof localStorage === 'undefined') return false;
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(sidebarCollapsed));
    } catch {
      /* ignore */
    }
  }, [sidebarCollapsed]);

  const installed = plugins.installed as InstalledPlugin[];

  const pluginNav = useMemo(
    () =>
      installed
        .filter((p) => isPluginEnabled(p.id))
        .map((p) => ({
          to: `/plugin/${encodeURIComponent(p.id)}`,
          label: p.name,
          id: p.id,
        })),
    [installed, isPluginEnabled]
  );

  const allNav = useMemo(
    () => [
      ...coreNav.map((n) => ({ ...n, kind: 'core' as const })),
      ...pluginNav.map((n) => ({ ...n, kind: 'plugin' as const, end: false, icon: Plug })),
      {
        to: '/marketplace',
        label: 'Plugin library',
        icon: Puzzle,
        end: false,
        kind: 'core' as const,
      },
    ],
    [pluginNav]
  );

  const c = sidebarCollapsed;

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    [
      'flex items-center rounded-2xl text-sm font-medium transition-colors no-underline',
      c ? 'h-10 w-10 shrink-0 justify-center p-0 mx-auto' : 'gap-3 px-4 py-3',
      isActive
        ? 'bg-ink-black text-canvas-cream'
        : 'text-ink-black/80 hover:bg-white/80 hover:text-ink-black',
    ].join(' ');

  return (
    <div className="min-h-screen flex flex-col bg-canvas-cream">
      <header className="sticky top-0 z-40 min-h-[4.5rem] shrink-0 border-b border-ink-black/10 bg-white/90 backdrop-blur-md">
        <div className="flex h-full min-h-[4.5rem] items-center justify-between gap-4 px-4 py-4 md:px-8 max-w-[1600px] mx-auto w-full">
          <div className="font-bold text-xl tracking-tighter text-ink-black">Piecemint<span className="text-signal-orange text-2xl leading-none">.</span></div>
          <div className="flex items-center gap-3 md:gap-4">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="w-11 h-11 md:w-12 md:h-12 rounded-full border border-ink-black/20 flex items-center justify-center shrink-0 text-ink-black hover:bg-ink-black/[0.05] transition-colors"
              aria-label="Open search"
              aria-keyshortcuts="Control+K Meta+K"
              aria-expanded={searchOpen}
              aria-controls="ff-global-search"
              title="Search — Ctrl+K or ⌘K"
            >
              <Search size={20} aria-hidden />
            </button>
          </div>
        </div>
      </header>

      <nav
        className="md:hidden flex gap-1 overflow-x-auto px-3 py-2 border-b border-ink-black/10 bg-lifted-cream/80"
        aria-label="Main"
      >
        {allNav.map((item) => (
          <NavLink
            key={item.kind === 'plugin' ? `p-${item.id}` : item.to}
            to={item.to}
            end={'end' in item ? item.end : false}
            className={mobileTabClass}
            title={item.label}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="flex flex-1 w-full min-w-0 md:items-start">
        <aside
          className={[
            'hidden md:flex shrink-0 flex-col border-r border-ink-black/10 bg-lifted-cream/50 gap-1',
            'transition-[width,padding] duration-300 ease-out',
            sidebarSticky,
            'md:shrink-0 md:overflow-y-auto md:overflow-x-hidden',
            'md:h-[calc(100vh-4.5rem)]',
            c ? 'md:w-[4.5rem] md:px-2 md:py-3' : 'md:w-64 md:p-4',
          ].join(' ')}
          aria-label="Sidebar"
          data-collapsed={c ? 'true' : 'false'}
        >
          <div className={c ? 'flex justify-center' : 'mb-1'}>
            <button
              type="button"
              onClick={() => setSidebarCollapsed((v) => !v)}
              className={[
                'flex items-center justify-center rounded-2xl border border-ink-black/15 text-ink-black/80 transition-colors',
                'hover:bg-white/80 hover:text-ink-black',
                c ? 'h-10 w-10 shrink-0' : 'w-full py-2.5 px-3 gap-2',
              ].join(' ')}
              aria-label={c ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-expanded={!c}
            >
              {c ? <ChevronRight size={20} strokeWidth={1.75} /> : <ChevronLeft size={20} strokeWidth={1.75} />}
              {!c && <span className="text-sm font-medium">Collapse</span>}
            </button>
          </div>

          {!c && (
            <p className="px-4 pt-2 pb-2 text-xs font-bold tracking-widest uppercase text-ink-black/45">Main</p>
          )}
          {c && <div className="h-1 shrink-0" aria-hidden="true" />}

          {coreNav.map(({ to, label, icon: Icon, end }) => (
            <SidebarItemTooltip key={to} label={label} collapsed={c}>
              <NavLink to={to} end={end} className={linkClass} title={c ? undefined : label}>
                <Icon size={20} strokeWidth={1.75} aria-hidden className="shrink-0" />
                <span className={c ? 'sr-only' : undefined}>{label}</span>
              </NavLink>
            </SidebarItemTooltip>
          ))}

          {pluginNav.length > 0 && (
            <>
              {!c && (
                <p className="px-4 pt-4 pb-2 text-xs font-bold tracking-widest uppercase text-ink-black/45">
                  Plugins
                </p>
              )}
              {c && <div className="h-2 shrink-0" aria-hidden="true" />}
              {pluginNav.map((p) => (
                <SidebarItemTooltip key={p.id} label={p.label} collapsed={c}>
                  <NavLink to={p.to} className={linkClass} title={c ? undefined : p.label}>
                    <Plug size={20} strokeWidth={1.75} aria-hidden className="shrink-0" />
                    <span className={c ? 'sr-only' : 'line-clamp-2 leading-snug'}>{p.label}</span>
                  </NavLink>
                </SidebarItemTooltip>
              ))}
            </>
          )}

          {!c && (
            <p className="px-4 pt-4 pb-2 text-xs font-bold tracking-widest uppercase text-ink-black/45">Library</p>
          )}
          {c && <div className="h-2 shrink-0" aria-hidden="true" />}

          <SidebarItemTooltip label="Plugin library" collapsed={c}>
            <NavLink to="/marketplace" className={linkClass} title={c ? undefined : 'Plugin library'}>
              <Puzzle size={20} strokeWidth={1.75} aria-hidden className="shrink-0" />
              <span className={c ? 'sr-only' : undefined}>Plugin library</span>
            </NavLink>
          </SidebarItemTooltip>
        </aside>

        <main className="flex-1 min-w-0 w-full">
          <div className="max-w-[1600px] w-full mx-auto px-4 py-8 md:px-10 md:py-10">
            <Outlet />
          </div>
        </main>
      </div>

      <div id="ff-global-search" className="contents" aria-hidden={!searchOpen}>
        <GlobalSearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      </div>
    </div>
  );
}
