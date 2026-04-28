import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  LayoutDashboard,
  LineChart,
  Users,
  Wallet2,
  Zap,
  Puzzle,
  Plug,
  User,
  Building2,
  type LucideIcon,
} from 'lucide-react';
import { useFinanceData } from '../context/FinanceDataContext';
import type { InstalledPlugin } from '../types/plugins';

type SearchItem = {
  id: string;
  to: string;
  title: string;
  subtitle?: string;
  section: string;
  haystack: string;
  Icon: LucideIcon;
};

function tokenMatch(query: string, haystack: string): boolean {
  const s = query.trim().toLowerCase();
  if (!s) return true;
  return s
    .split(/\s+/)
    .filter(Boolean)
    .every((t) => haystack.includes(t));
}

type CoreEntry = {
  to: string;
  title: string;
  subtitle: string;
  section: string;
  kws: string;
  Icon: LucideIcon;
};

const CORE_ITEMS: CoreEntry[] = [
  {
    to: '/',
    title: 'Overview',
    subtitle: 'Main dashboard',
    section: 'Pages',
    kws: 'home dashboard start main summary',
    Icon: LayoutDashboard,
  },
  {
    to: '/analytics',
    title: 'Cash & analytics',
    subtitle: 'Charts, forecast, and reports',
    section: 'Pages',
    kws: 'analytics charts reports cash flow forecast money trends',
    Icon: LineChart,
  },
  {
    to: '/budget',
    title: 'Budget & cash flow',
    subtitle: 'Plan spending and safe-to-spend',
    section: 'Pages',
    kws: 'budget planning spending safe categories',
    Icon: Wallet2,
  },
  {
    to: '/contacts',
    title: 'Clients & suppliers',
    subtitle: 'People, vendors, and categories',
    section: 'Pages',
    kws: 'contacts clients suppliers vendors people crm',
    Icon: Users,
  },
  {
    to: '/activity',
    title: 'Transactions & alerts',
    subtitle: 'Feed and recent activity',
    section: 'Pages',
    kws: 'activity transactions alerts feed events history',
    Icon: Zap,
  },
  {
    to: '/marketplace',
    title: 'Plugin library',
    subtitle: 'Install and enable extensions',
    section: 'Pages',
    kws: 'marketplace plugins extensions install add-ons library',
    Icon: Puzzle,
  },
  {
    to: '/docs/plugins',
    title: 'Build a plugin',
    subtitle: 'Developer guide — manifest and API routes',
    section: 'Help',
    kws: 'documentation docs developer build plugin manifest logic python custom',
    Icon: BookOpen,
  },
];

type GlobalSearchModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function GlobalSearchModal({ open, onClose }: GlobalSearchModalProps) {
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { plugins, isPluginEnabled, clients, suppliers } = useFinanceData();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);

  const items = useMemo((): SearchItem[] => {
    const core: SearchItem[] = CORE_ITEMS.map((c) => ({
      id: `core-${c.to}`,
      to: c.to,
      title: c.title,
      subtitle: c.subtitle,
      section: c.section,
      haystack: `${c.title} ${c.subtitle ?? ''} ${c.kws}`.toLowerCase(),
      Icon: c.Icon,
    }));

    const installed = plugins.installed as InstalledPlugin[];
    const pluginItems: SearchItem[] = installed
      .filter((p) => isPluginEnabled(p.id))
      .map((p) => ({
        id: `plugin-${p.id}`,
        to: `/plugin/${encodeURIComponent(p.id)}`,
        title: p.name,
        subtitle: p.description || p.version,
        section: 'Plugins',
        haystack: `${p.id} ${p.name} ${p.description} ${p.version}`.toLowerCase(),
        Icon: Plug,
      }));

    const q = query.trim();
    const showPeople = q.length >= 1;

    const clientItems: SearchItem[] = !showPeople
      ? []
      : (clients as { id: string; name: string; email: string }[])
          .filter((c) => tokenMatch(q, `${c.name} ${c.email} client customer`.toLowerCase()))
          .slice(0, 12)
          .map((c) => ({
            id: `client-${c.id}`,
            to: `/contacts?${new URLSearchParams({ client: c.id }).toString()}`,
            title: c.name,
            subtitle: 'Client',
            section: 'People',
            haystack: `${c.name} ${c.email} client customer`.toLowerCase(),
            Icon: User,
          }));

    const supplierItems: SearchItem[] = !showPeople
      ? []
      : (suppliers as { id: string; name: string; email: string }[])
          .filter((s) => tokenMatch(q, `${s.name} ${s.email} supplier vendor`.toLowerCase()))
          .slice(0, 12)
          .map((s) => ({
            id: `supplier-${s.id}`,
            to: `/contacts?${new URLSearchParams({ supplier: s.id }).toString()}`,
            title: s.name,
            subtitle: 'Supplier',
            section: 'People',
            haystack: `${s.name} ${s.email} supplier vendor`.toLowerCase(),
            Icon: Building2,
          }));

    return [...core, ...pluginItems, ...clientItems, ...supplierItems];
  }, [plugins.installed, isPluginEnabled, clients, suppliers, query]);

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return items;
    return items.filter((it) => tokenMatch(q, it.haystack));
  }, [items, query]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      const t = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(t);
    }
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  useEffect(() => {
    if (active < 0 || active >= filtered.length) return;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [active, filtered.length]);

  const go = useCallback(
    (to: string) => {
      navigate(to);
      onClose();
    },
    [navigate, onClose]
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, Math.max(0, filtered.length - 1)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === 'Enter' && filtered[active]) {
      e.preventDefault();
      go(filtered[active].to);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActive(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setActive(Math.max(0, filtered.length - 1));
    }
  };

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', onDoc);
    return () => document.removeEventListener('keydown', onDoc);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[95] flex items-start sm:items-center justify-center p-0 sm:p-6 pt-16 sm:pt-6" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-ink-black/45 backdrop-blur-sm border-0 w-full h-full cursor-default"
        onClick={onClose}
        aria-label="Close search"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full sm:max-w-xl max-h-[min(88vh,560px)] flex flex-col bg-canvas-cream sm:rounded-3xl shadow-2xl border border-ink-black/10 mx-3 sm:mx-0"
        onKeyDown={onKeyDown}
      >
        <h2 id={titleId} className="sr-only">
          Search
        </h2>
        <div className="shrink-0 flex items-center gap-3 px-4 py-3 sm:px-5 sm:py-4 border-b border-ink-black/10">
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder="Search pages, plugins, people…"
            className="flex-1 min-w-0 bg-transparent border-0 text-base outline-none ring-0 placeholder:text-ink-black/40"
            aria-autocomplete="list"
            aria-controls="global-search-results"
            aria-activedescendant={filtered[active] ? `search-option-${active}` : undefined}
          />
          <kbd
            className="hidden sm:inline-flex shrink-0 items-center gap-0.5 rounded-lg border border-ink-black/15 bg-ink-black/[0.04] px-2 py-1 text-[10px] font-medium text-ink-black/50"
            aria-hidden
          >
            esc
          </kbd>
        </div>

        <div
          ref={listRef}
          id="global-search-results"
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain py-2"
        >
          {filtered.length === 0 ? (
            <p className="px-5 py-10 text-center text-ink-black/50 text-sm">No results match your search.</p>
          ) : (
            filtered.map((it, flatIdx) => {
              const isActive = flatIdx === active;
              const prev = filtered[flatIdx - 1];
              const showHeader = !prev || prev.section !== it.section;
              return (
                <div key={it.id}>
                  {showHeader && (
                    <p
                      className="px-4 sm:px-5 py-1.5 mt-1 first:mt-0 text-[10px] font-bold tracking-widest uppercase text-ink-black/40"
                      role="presentation"
                    >
                      {it.section}
                    </p>
                  )}
                  <button
                    type="button"
                    id={`search-option-${flatIdx}`}
                    data-idx={flatIdx}
                    onClick={() => go(it.to)}
                    onMouseEnter={() => setActive(flatIdx)}
                    className={[
                      'w-full text-left flex items-center gap-3 px-4 sm:px-5 py-2.5 border-0',
                      isActive
                        ? 'bg-ink-black text-canvas-cream'
                        : 'bg-transparent text-ink-black hover:bg-ink-black/[0.06]',
                    ].join(' ')}
                  >
                    <it.Icon
                      size={20}
                      strokeWidth={1.75}
                      className="shrink-0 opacity-80"
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{it.title}</div>
                      {it.subtitle && (
                        <div
                          className={[
                            'text-xs truncate',
                            isActive ? 'text-canvas-cream/75' : 'text-ink-black/50',
                          ].join(' ')}
                        >
                          {it.subtitle}
                        </div>
                      )}
                    </div>
                    <ArrowRight
                      size={16}
                      className="shrink-0 opacity-50"
                      aria-hidden
                    />
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className="shrink-0 flex items-center justify-between gap-2 px-4 py-2.5 sm:px-5 border-t border-ink-black/10 text-[11px] text-ink-black/45">
          <span>
            <kbd className="px-1 py-0.5 rounded border border-ink-black/10 bg-ink-black/[0.03]">↑</kbd>{' '}
            <kbd className="px-1 py-0.5 rounded border border-ink-black/10 bg-ink-black/[0.03]">↓</kbd> move ·{' '}
            <kbd className="px-1 py-0.5 rounded border border-ink-black/10 bg-ink-black/[0.03]">⏎</kbd> open
          </span>
          <span className="hidden sm:inline">Type to filter — clients & suppliers when you start typing</span>
        </div>
      </div>
    </div>
  );
}

export function isSearchShortcut(e: KeyboardEvent): boolean {
  return (e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K');
}
