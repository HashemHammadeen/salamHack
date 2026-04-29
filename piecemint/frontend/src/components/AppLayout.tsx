import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
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
  Store,
  type LucideIcon,
} from 'lucide-react';
import { useFinanceData } from '../context/FinanceDataContext';
import type { InstalledPlugin } from '../types/plugins';
import { MARKETPLACE_URL } from '../lib/marketplaceUrl';
import { PluginGlyph } from './PluginGlyph';

/** Same vertical rhythm as floating header: sticky top-6 (1.5rem) + header h-[80px] + gap. */
const SIDEBAR_STICKY_TOP = 'md:sticky md:top-[calc(1.5rem+80px+0.75rem)]';
const SIDEBAR_MAX_H =
  'md:max-h-[calc(100vh-1.5rem-80px-0.75rem-1.5rem-1.5rem)]';

const SIDEBAR_INNER_MAX_H =
  'max-h-[calc(100vh-1.5rem-80px-0.75rem-1.5rem-1.5rem)]';

const floatingShell =
  'bg-white/90 backdrop-blur-md border border-ink-black/10 shadow-[0px_4px_24px_rgba(0,0,0,0.04)]';

/**
 * Sidebar dock must set z-index so it wins paint order over `main` (flex sibling after dock in DOM).
 * Expanded: just under floating header (z-50). Collapsed: above main (z-0) for rail tooltips.
 */
const SIDEBAR_DOCK_Z_EXPANDED = 'z-[49]';
const SIDEBAR_DOCK_Z_COLLAPSED = 'z-10';

const DOCK_W = 'md:w-[4.5rem]';

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
  active,
  children,
}: {
  label: string;
  active: boolean;
  children: ReactNode;
}) {
  const { open, onEnter, onLeave } = useDelayedTooltip(active);

  return (
    <div className="relative" onMouseEnter={onEnter} onMouseLeave={onLeave}>
      {children}
      {active && open && (
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

/** In-flow placeholder so the dock keeps height when the real aside is `position:absolute` and expanded. */
function SidebarDockHeightAnchor({ pluginCount }: { pluginCount: number }) {
  return (
    <div
      className="flex w-full flex-col gap-1 px-2 py-3 opacity-0 pointer-events-none select-none"
      aria-hidden
    >
      <div className="mb-1 flex justify-center">
        <div className="h-10 w-10 shrink-0 rounded-2xl" />
      </div>
      <div className="h-1 shrink-0" />
      {coreNav.map((_, i) => (
        <div key={i} className="mx-auto h-10 w-10 shrink-0 rounded-2xl" />
      ))}
      {pluginCount > 0 && (
        <>
          <div className="h-2 shrink-0" />
          {Array.from({ length: pluginCount }).map((_, i) => (
            <div key={`p-${i}`} className="mx-auto h-10 w-10 shrink-0 rounded-2xl" />
          ))}
        </>
      )}
      <div className="h-2 shrink-0" />
      <div className="mx-auto h-10 w-10 shrink-0 rounded-2xl" />
    </div>
  );
}

function mobileTabClass({ isActive }: { isActive: boolean }) {
  return [
    'shrink-0 rounded-full px-3 py-2 text-xs font-medium no-underline max-w-[140px] truncate',
    isActive ? 'bg-ink-black text-canvas-cream' : 'text-ink-black/70',
  ].join(' ');
}

function staggerMs(i: number, step = 40, base = 18): CSSProperties {
  return { ['--ff-sidebar-stagger' as string]: `${base + i * step}ms` };
}

type PluginNavItem = { to: string; label: string; id: string; has_icon?: boolean };

function SidebarExpandedContent({
  pluginNav,
  expandedLinkClass,
  onCollapse,
}: {
  pluginNav: PluginNavItem[];
  expandedLinkClass: (opts: { isActive: boolean }) => string;
  onCollapse: () => void;
}) {
  let s = 0;
  const next = () => staggerMs(s++);

  const linkCls = (opts: { isActive: boolean }) =>
    [expandedLinkClass(opts), 'ff-sidebar-item-open'].join(' ');

  return (
    <>
      <div className="ff-sidebar-item-open mb-1" style={next()}>
        <button
          type="button"
          onClick={onCollapse}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-ink-black/15 py-2.5 px-3 text-sm font-medium text-ink-black/80 transition-colors hover:bg-white/80 hover:text-ink-black"
          aria-label="Collapse navigation"
        >
          <ChevronLeft size={20} strokeWidth={1.75} aria-hidden />
          Close
        </button>
      </div>
      <p
        className="ff-sidebar-item-open px-4 pb-2 pt-2 text-xs font-bold tracking-widest uppercase text-ink-black/45"
        style={next()}
      >
        Main
      </p>
      {coreNav.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={linkCls}
          style={next()}
          onClick={onCollapse}
        >
          <Icon size={20} strokeWidth={1.75} aria-hidden className="shrink-0" />
          {label}
        </NavLink>
      ))}
      {pluginNav.length > 0 && (
        <>
          <p
            className="ff-sidebar-item-open px-4 pb-2 pt-4 text-xs font-bold tracking-widest uppercase text-ink-black/45"
            style={next()}
          >
            Plugins
          </p>
          {pluginNav.map((p) => (
            <NavLink key={p.id} to={p.to} className={linkCls} style={next()} onClick={onCollapse}>
              <PluginGlyph pluginId={p.id} hasIcon={p.has_icon} fallback={Plug} size={20} />
              <span className="line-clamp-2 leading-snug">{p.label}</span>
            </NavLink>
          ))}
        </>
      )}
      <p
        className="ff-sidebar-item-open px-4 pb-2 pt-4 text-xs font-bold tracking-widest uppercase text-ink-black/45"
        style={next()}
      >
        Library
      </p>
      <NavLink to="/marketplace" className={linkCls} style={next()} onClick={onCollapse}>
        <Puzzle size={20} strokeWidth={1.75} aria-hidden className="shrink-0" />
        Plugin library
      </NavLink>
    </>
  );
}

export default function AppLayout() {
  const { plugins, isPluginEnabled } = useFinanceData();
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [sidebarClosing, setSidebarClosing] = useState(false);
  const [mobileNavFade, setMobileNavFade] = useState({ left: false, right: false });
  const sidebarDockRef = useRef<HTMLDivElement>(null);
  const sidebarCloseFallbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mobileNavRef = useRef<HTMLElement>(null);

  const finishSidebarCollapse = useCallback(() => {
    if (sidebarCloseFallbackRef.current) {
      clearTimeout(sidebarCloseFallbackRef.current);
      sidebarCloseFallbackRef.current = null;
    }
    setSidebarExpanded(false);
    setSidebarClosing(false);
  }, []);

  const requestSidebarCollapse = useCallback(() => {
    if (!sidebarExpanded || sidebarClosing) return;
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      finishSidebarCollapse();
      return;
    }
    setSidebarClosing(true);
  }, [sidebarExpanded, sidebarClosing, finishSidebarCollapse]);

  useEffect(() => {
    if (!sidebarClosing) return;
    sidebarCloseFallbackRef.current = setTimeout(finishSidebarCollapse, 780);
    return () => {
      if (sidebarCloseFallbackRef.current) {
        clearTimeout(sidebarCloseFallbackRef.current);
        sidebarCloseFallbackRef.current = null;
      }
    };
  }, [sidebarClosing, finishSidebarCollapse]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isSearchShortcut(e)) {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
      if (e.key === 'Escape' && sidebarExpanded && !sidebarClosing) {
        requestSidebarCollapse();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [sidebarExpanded, sidebarClosing, requestSidebarCollapse]);

  useEffect(() => {
    if (!sidebarExpanded) return;
    const onPointerDown = (e: PointerEvent) => {
      const el = e.target as Node | null;
      if (!el || !sidebarDockRef.current?.contains(el)) {
        requestSidebarCollapse();
      }
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, [sidebarExpanded, requestSidebarCollapse]);

  const installed = plugins.installed as InstalledPlugin[];

  const pluginNav = useMemo(
    () =>
      installed
        .filter((p) => isPluginEnabled(p.id))
        .map((p) => ({
          to: `/plugin/${encodeURIComponent(p.id)}`,
          label: p.name,
          id: p.id,
          has_icon: p.has_icon,
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

  const updateMobileNavFade = useCallback(() => {
    const el = mobileNavRef.current;
    if (!el) return;
    const maxScrollLeft = Math.max(0, el.scrollWidth - el.clientWidth);
    const left = el.scrollLeft > 2;
    const right = el.scrollLeft < maxScrollLeft - 2;
    setMobileNavFade((prev) => (prev.left === left && prev.right === right ? prev : { left, right }));
  }, []);

  useEffect(() => {
    updateMobileNavFade();
    const onResize = () => updateMobileNavFade();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [updateMobileNavFade]);

  useEffect(() => {
    const id = window.requestAnimationFrame(updateMobileNavFade);
    return () => window.cancelAnimationFrame(id);
  }, [allNav.length, location.pathname, updateMobileNavFade]);

  const railLinkClass = ({ isActive }: { isActive: boolean }) =>
    [
      'flex items-center rounded-2xl text-sm font-medium transition-colors no-underline',
      'h-10 w-10 shrink-0 justify-center p-0 mx-auto',
      isActive
        ? 'bg-ink-black text-canvas-cream'
        : 'text-ink-black/80 hover:bg-white/80 hover:text-ink-black',
    ].join(' ');

  const expandedLinkClass = ({ isActive }: { isActive: boolean }) =>
    [
      'flex items-center rounded-2xl text-sm font-medium transition-colors no-underline',
      'gap-3 px-4 py-3',
      isActive
        ? 'bg-ink-black text-canvas-cream'
        : 'text-ink-black/80 hover:bg-white/80 hover:text-ink-black',
    ].join(' ');

  const showTooltips = !sidebarExpanded;

  return (
    <div className="min-h-screen flex flex-col bg-canvas-cream">
      <header
        className={[
          'sticky top-6 z-50 mx-auto mt-6 w-[calc(100%-1.5rem)] max-w-[1800px] shrink-0 sm:w-[calc(100%-3rem)]',
          'rounded-[1.75rem] px-3 pt-3 pb-2 md:rounded-[999px] md:px-8 md:py-0 lg:px-10',
          floatingShell,
        ].join(' ')}
      >
        <div className="flex h-[64px] items-center justify-between gap-4 px-1 sm:px-2 md:h-[80px] md:px-0">
          <div className="font-bold text-xl tracking-[-0.02em] text-ink-black shrink-0 min-w-0">
            Piecemint<span className="text-signal-orange text-2xl leading-none">.</span>
          </div>
          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            <a
              href={MARKETPLACE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-11 h-11 md:w-12 md:h-12 rounded-full border border-ink-black/15 bg-white items-center justify-center shrink-0 text-ink-black hover:bg-canvas-cream transition-colors no-underline"
              aria-label="Open plugin marketplace website"
              title="Plugin marketplace (new tab)"
            >
              <Store size={20} aria-hidden />
            </a>
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="w-11 h-11 md:w-12 md:h-12 rounded-full border border-ink-black/15 bg-white flex items-center justify-center shrink-0 text-ink-black hover:bg-canvas-cream transition-colors"
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
        <div className="md:hidden relative">
          <nav
            ref={mobileNavRef}
            className="flex gap-1 overflow-x-auto px-3 py-2 ff-no-scrollbar"
            aria-label="Main"
            onScroll={updateMobileNavFade}
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
          {mobileNavFade.left && (
            <div
              className="pointer-events-none absolute bottom-0 left-0 top-0 w-10 rounded-l-[999px] bg-gradient-to-r from-white/95 via-white/70 to-transparent"
              aria-hidden
            />
          )}
          {mobileNavFade.right && (
            <div
              className="pointer-events-none absolute bottom-0 right-0 top-0 w-10 rounded-r-[999px] bg-gradient-to-l from-white/95 via-white/70 to-transparent"
              aria-hidden
            />
          )}
        </div>
      </header>

      <div className="flex w-full min-w-0 flex-1 md:items-start md:gap-6 md:px-4 lg:px-6 xl:px-8 md:pb-6 md:pt-4">
        <div
          ref={sidebarDockRef}
          className={[
            'relative hidden md:block shrink-0 self-start',
            DOCK_W,
            SIDEBAR_STICKY_TOP,
            SIDEBAR_MAX_H,
            sidebarExpanded ? SIDEBAR_DOCK_Z_EXPANDED : SIDEBAR_DOCK_Z_COLLAPSED,
          ].join(' ')}
        >
          {sidebarExpanded && <SidebarDockHeightAnchor pluginCount={pluginNav.length} />}

          <aside
            id="ff-sidebar"
            className={[
              'ff-sidebar-scroll flex flex-col gap-1 rounded-[2rem] overflow-y-auto overflow-x-hidden min-h-0',
              SIDEBAR_INNER_MAX_H,
              sidebarExpanded
                ? [
                    'absolute left-0 top-0 z-10 w-64 max-w-[min(16rem,calc(100vw-8rem))]',
                    'px-4 py-3',
                    'border border-ink-black/10 bg-white/95 shadow-[0px_12px_40px_rgba(0,0,0,0.12)] backdrop-blur-md',
                    sidebarClosing ? 'ff-sidebar-panel-close' : 'ff-sidebar-panel-open',
                  ].join(' ')
                : [
                    'relative z-10 w-full px-2 py-3 transition-[box-shadow] duration-200 ease-out',
                    floatingShell,
                  ].join(' '),
            ].join(' ')}
            aria-label="Sidebar"
            aria-expanded={sidebarExpanded}
            onAnimationEnd={(e) => {
              if (e.target !== e.currentTarget) return;
              if (!sidebarClosing) return;
              const n = e.animationName;
              if (n === 'ff-sidebar-panel-close' || n.endsWith('ff-sidebar-panel-close')) {
                finishSidebarCollapse();
              }
            }}
          >
            {sidebarExpanded ? (
              <SidebarExpandedContent
                pluginNav={pluginNav}
                expandedLinkClass={expandedLinkClass}
                onCollapse={requestSidebarCollapse}
              />
            ) : (
              <>
                <div className="flex justify-center mb-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSidebarClosing(false);
                      setSidebarExpanded(true);
                    }}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-ink-black/15 text-ink-black/80 transition-colors hover:bg-white/80 hover:text-ink-black"
                    aria-label="Expand navigation"
                    aria-expanded={sidebarExpanded}
                    aria-controls="ff-sidebar"
                  >
                    <ChevronRight size={20} strokeWidth={1.75} aria-hidden />
                  </button>
                </div>

                <div className="h-1 shrink-0" aria-hidden />

                {coreNav.map(({ to, label, icon: Icon, end }) => (
                  <SidebarItemTooltip key={to} label={label} active={showTooltips}>
                    <NavLink to={to} end={end} className={railLinkClass} onClick={requestSidebarCollapse}>
                      <Icon size={20} strokeWidth={1.75} aria-hidden className="shrink-0" />
                      <span className="sr-only">{label}</span>
                    </NavLink>
                  </SidebarItemTooltip>
                ))}

                {pluginNav.length > 0 && (
                  <>
                    <div className="h-2 shrink-0" aria-hidden />
                    {pluginNav.map((p) => (
                      <SidebarItemTooltip key={p.id} label={p.label} active={showTooltips}>
                        <NavLink to={p.to} className={railLinkClass} onClick={requestSidebarCollapse}>
                          <PluginGlyph pluginId={p.id} hasIcon={p.has_icon} fallback={Plug} size={20} />
                          <span className="sr-only">{p.label}</span>
                        </NavLink>
                      </SidebarItemTooltip>
                    ))}
                  </>
                )}

                <div className="h-2 shrink-0" aria-hidden />

                <SidebarItemTooltip label="Plugin library" active={showTooltips}>
                  <NavLink to="/marketplace" className={railLinkClass} onClick={requestSidebarCollapse}>
                    <Puzzle size={20} strokeWidth={1.75} aria-hidden className="shrink-0" />
                    <span className="sr-only">Plugin library</span>
                  </NavLink>
                </SidebarItemTooltip>
              </>
            )}
          </aside>
        </div>

        <main className="relative z-0 min-w-0 w-full flex-1">
          <div className="mx-auto w-full max-w-[1800px] px-4 py-7 sm:px-5 md:px-6 md:py-9 lg:px-8 xl:px-10">
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
