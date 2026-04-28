import { Puzzle, CheckCircle2, Download, Search, BookOpen, FileCode2, RefreshCw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useFinanceData } from '../context/FinanceDataContext';
import { PluginEnableSwitch } from '../components/PluginEnableSwitch';
import AddPluginModal from '../components/AddPluginModal';
import type { InstalledPlugin } from '../types/plugins';

type StatusFilter = 'all' | 'installed' | 'not_installed';

function pluginMatchesQuery(p: InstalledPlugin, q: string) {
  if (!q) return true;
  const s = (v: string) => v.toLowerCase();
  return (
    s(p.id).includes(q) ||
    s(p.name).includes(q) ||
    s(p.description).includes(q) ||
    s(p.version).includes(q)
  );
}

function mergePlugins(installed: InstalledPlugin[], available: InstalledPlugin[]) {
  const byId = new Map<string, InstalledPlugin & { _installed: boolean }>();
  for (const p of installed) {
    byId.set(p.id, { ...p, _installed: true });
  }
  for (const p of available) {
    if (!byId.has(p.id)) {
      byId.set(p.id, { ...p, _installed: false });
    }
  }
  return Array.from(byId.values());
}

export default function Marketplace() {
  const { plugins, refresh, isPluginEnabled, setPluginEnabled } = useFinanceData();
  const installed = plugins.installed as InstalledPlugin[];
  const available = plugins.available as InstalledPlugin[];

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [addPluginOpen, setAddPluginOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefreshPlugins = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  };

  const allPlugins = useMemo(
    () => mergePlugins(installed, available),
    [installed, available]
  );

  const searchNorm = search.trim().toLowerCase();

  const filteredPlugins = useMemo(() => {
    return allPlugins.filter((p) => {
      if (status === 'installed' && !p._installed) return false;
      if (status === 'not_installed' && p._installed) return false;
      return pluginMatchesQuery(p, searchNorm);
    });
  }, [allPlugins, searchNorm, status]);

  return (
    <div className="space-y-16 max-w-5xl">
      <section>
        <h1 className="mb-4 text-3xl md:text-4xl font-medium tracking-tight">Plugin marketplace</h1>
        <p className="text-lg text-ink-black/80 max-w-2xl">
          Extend Piecemint with specialized modules. Use the switch to enable or disable each plugin
          for this app. Install by moving a folder into{' '}
          <code className="text-sm bg-ink-black/5 px-2 py-0.5 rounded-lg">plugins/</code> on the
          server, then refresh this list.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row flex-wrap gap-3">
          <Link
            to="/docs/plugins"
            className="pill-button-secondary inline-flex items-center justify-center gap-2 no-underline w-full sm:w-auto"
          >
            <BookOpen size={18} aria-hidden />
            How to build a plugin
          </Link>
          <button
            type="button"
            onClick={() => setAddPluginOpen(true)}
            className="pill-button inline-flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <FileCode2 size={18} aria-hidden />
            Add your plugin
          </button>
        </div>
      </section>

      {addPluginOpen && (
        <AddPluginModal
          onClose={() => setAddPluginOpen(false)}
          onInstalled={() => void refresh()}
        />
      )}

      {allPlugins.length > 0 && (
        <section>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-6">
            <div className="flex flex-wrap items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-signal-orange shrink-0" />
              <h2 className="text-sm font-bold tracking-widest uppercase text-ink-black/60">
                All plugins
              </h2>
              <button
                type="button"
                onClick={() => void handleRefreshPlugins()}
                disabled={refreshing}
                aria-busy={refreshing}
                aria-label="Refresh plugin list"
                title="Refresh plugin list"
                className={[
                  'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink-black/20 text-ink-black/70 transition-colors',
                  'hover:enabled:bg-ink-black/[0.05] hover:enabled:text-ink-black',
                  'disabled:opacity-60 disabled:cursor-wait',
                ].join(' ')}
              >
                <RefreshCw
                  size={18}
                  strokeWidth={1.75}
                  aria-hidden
                  className={refreshing ? 'animate-spin motion-reduce:animate-none' : undefined}
                />
              </button>
              <span className="text-sm text-ink-black/50 tabular-nums" aria-live="polite">
                {filteredPlugins.length === allPlugins.length
                  ? `${allPlugins.length} ${
                      allPlugins.length === 1 ? 'plugin' : 'plugins'
                    }`
                  : `${filteredPlugins.length} of ${allPlugins.length} shown`}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch sm:gap-6 mb-8">
            <div className="relative flex-1 min-w-0 max-w-xl">
              <label htmlFor="plugin-marketplace-search" className="sr-only">
                Search plugins
              </label>
              <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-black/50 pointer-events-none"
                size={18}
                strokeWidth={1.75}
                aria-hidden
              />
              <input
                id="plugin-marketplace-search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, id, or description"
                className="w-full py-2.5 pl-10 pr-4 rounded-full border-2 border-ink-black/15 bg-white/80 text-sm font-medium text-ink-black/80 outline-none transition-colors focus:border-ink-black hover:border-ink-black/30 focus:ring-0 placeholder:text-ink-black/40 placeholder:font-normal"
                autoComplete="off"
              />
            </div>
            <div
              className="flex flex-wrap gap-2 sm:shrink-0"
              role="group"
              aria-label="Filter by install status"
            >
              {(
                [
                  { id: 'all' as const, label: 'All' },
                  { id: 'installed' as const, label: 'Installed' },
                  { id: 'not_installed' as const, label: 'Not installed' },
                ] as const
              ).map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setStatus(id)}
                  className={[
                    'px-4 py-2.5 rounded-full text-sm font-medium transition-colors border-2',
                    status === id
                      ? 'bg-ink-black text-canvas-cream border-ink-black'
                      : 'bg-white/80 text-ink-black/80 border-ink-black/15 hover:border-ink-black/30',
                  ].join(' ')}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {filteredPlugins.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-ink-black/80 font-medium mb-1">No plugins match your filters</p>
              <p className="text-sm text-ink-black/55">
                Try a different search term or switch the install filter to &ldquo;All&rdquo;.
              </p>
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredPlugins.map((p) => {
              const installedRow = p._installed;
              return (
                <div
                  key={p.id}
                  className={[
                    'card border-2 p-0 overflow-hidden',
                    installedRow ? 'border-ink-black/5' : 'bg-canvas-cream border-ink-black/10 shadow-none',
                  ].join(' ')}
                >
                  <div className="p-2 border-b border-ink-black/10 bg-ink-black/[0.02]">
                    <PluginEnableSwitch
                      pluginId={p.id}
                      name={p.name}
                      enabled={isPluginEnabled(p.id)}
                      onChange={(next) => setPluginEnabled(p.id, next)}
                    />
                  </div>
                  <div className="p-6 pt-5">
                    <div className="flex justify-between items-start mb-6">
                      <div
                        className={[
                          'w-12 h-12 rounded-full flex items-center justify-center',
                          installedRow ? 'bg-ink-black/5' : 'bg-white shadow-sm',
                        ].join(' ')}
                      >
                        {installedRow ? (
                          <CheckCircle2 className="text-ink-black" size={24} aria-hidden />
                        ) : (
                          <Download className="text-ink-black/40" size={24} aria-hidden />
                        )}
                      </div>
                      <span
                        className={[
                          'text-xs font-bold px-3 py-1 rounded-full',
                          installedRow ? 'bg-ink-black/5' : 'bg-white shadow-sm',
                        ].join(' ')}
                      >
                        v{p.version}
                      </span>
                    </div>
                    <h3
                      className={[
                        'mb-2 text-xl font-medium',
                        installedRow ? '' : 'text-ink-black/80',
                      ].join(' ')}
                    >
                      {p.name}
                    </h3>
                    <p
                      className={[
                        'mb-4',
                        installedRow ? 'text-ink-black/60' : 'text-ink-black/50',
                      ].join(' ')}
                    >
                      {p.description}
                    </p>
                    {installedRow ? (
                      <p className="text-sm font-medium text-ink-black/70">
                        <span
                          className={[
                            'inline-block w-2 h-2 rounded-full mr-2 align-middle',
                            isPluginEnabled(p.id) ? 'bg-signal-orange' : 'bg-ink-black/25',
                          ].join(' ')}
                        />
                        {isPluginEnabled(p.id) ? 'Enabled in app' : 'Disabled'}
                      </p>
                    ) : (
                      <p className="text-sm text-ink-black/50">
                        Not installed — preference takes effect if you add this module later.
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </section>
      )}

      {allPlugins.length === 0 && (
        <section>
          <div className="card text-center py-12">
            <Puzzle className="mx-auto text-ink-black/20 mb-4" size={48} aria-hidden />
            <h3 className="mb-2 text-xl font-medium">No plugin metadata</h3>
            <p className="text-ink-black/60">
              Add plugin folders under <code>plugins/</code> or <code>disabled_plugins/</code>, then
              refresh.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
