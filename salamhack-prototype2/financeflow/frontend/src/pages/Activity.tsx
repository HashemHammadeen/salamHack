import { useEffect, useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { AlertTriangle, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { useFinanceData } from '../context/FinanceDataContext';
import TransactionShowModal, { type TransactionRecord } from '../components/TransactionShowModal';
import EntityCategorySelect from '../components/EntityCategorySelect';

const TX_PAGE_SIZE = 10;

export default function Activity() {
  const {
    transactions,
    forecast,
    isPluginActive,
    searchExpenses,
  } = useFinanceData();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [txPage, setTxPage] = useState(1);
  const [showTransaction, setShowTransaction] = useState<TransactionRecord | null>(null);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const zombies = transactions.filter(
    (t: { is_recurring: boolean; last_activity: string }) =>
      t.is_recurring && new Date(t.last_activity) < thirtyDaysAgo
  );

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !isPluginActive('expense_categorizer')) return;
    try {
      const results = await searchExpenses(searchQuery);
      setSearchResults(results);
    } catch (err) {
      console.error(err);
    }
  };

  const sortedTx = useMemo(
    () =>
      [...transactions].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
    [transactions]
  );

  const txTotal = sortedTx.length;
  const txTotalPages = Math.max(1, Math.ceil(txTotal / TX_PAGE_SIZE));
  const txPageSafe = Math.min(txPage, txTotalPages);

  useEffect(() => {
    if (txPage > txTotalPages) {
      setTxPage(txTotalPages);
    }
  }, [txPage, txTotalPages]);

  const txStart = txTotal === 0 ? 0 : (txPageSafe - 1) * TX_PAGE_SIZE + 1;
  const txEnd = Math.min(txPageSafe * TX_PAGE_SIZE, txTotal);
  const pagedTx = sortedTx.slice(
    (txPageSafe - 1) * TX_PAGE_SIZE,
    txPageSafe * TX_PAGE_SIZE
  );

  return (
    <div className="space-y-12 max-w-5xl">
      <header>
        <h1 className="text-3xl md:text-4xl font-medium tracking-tight mb-2">Transactions & alerts</h1>
        <p className="text-ink-black/70 max-w-2xl">
          All movements, recurring subscriptions that may have gone stale, AI forecast (if installed),
          and natural-language search with the Smart Categorizer plugin.
        </p>
      </header>

      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-ink-black" />
          <h2 className="text-sm font-bold tracking-widest uppercase text-ink-black/60">
            All transactions
          </h2>
        </div>
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink-black/10">
                <th className="pb-3 pr-4 font-medium">Date</th>
                <th className="pb-3 pr-4 font-medium">App category</th>
                <th className="pb-3 pr-4 font-medium">Type</th>
                <th className="pb-3 pr-4 font-medium text-right">Amount</th>
                <th className="pb-3 w-[88px] text-right font-medium">Show</th>
              </tr>
            </thead>
            <tbody>
              {pagedTx.map((t: TransactionRecord) => (
                <tr key={t.id} className="border-b border-ink-black/5 last:border-0">
                  <td className="py-3 pr-4 whitespace-nowrap">{t.date}</td>
                  <td className="py-3 pr-4 align-middle">
                    <EntityCategorySelect
                      kind="transaction"
                      entityId={t.id}
                      fallback={t.category}
                    />
                  </td>
                  <td className="py-3 pr-4 capitalize">{t.type}</td>
                  <td className="py-3 pr-4 text-right font-medium">
                    {t.amount < 0 ? '−' : ''}$
                    {Math.abs(t.amount).toLocaleString(undefined, { minimumFractionDigits: 0 })}
                  </td>
                  <td className="py-3 pl-2 text-right align-middle">
                    <button
                      type="button"
                      onClick={() => setShowTransaction(t)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-full border border-ink-black/20 px-3 py-1.5 text-xs font-medium text-ink-black hover:bg-ink-black hover:text-canvas-cream transition-colors"
                    >
                      <Eye size={14} />
                      Show
                    </button>
                  </td>
                </tr>
              ))}
              {txTotal === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-ink-black/60">
                    No transactions.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {txTotal > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4 px-1 text-sm text-ink-black/70">
            <p className="tabular-nums">
              Showing {txStart}–{txEnd} of {txTotal}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTxPage((p) => Math.max(1, p - 1))}
                disabled={txPageSafe <= 1}
                className="inline-flex items-center gap-1 rounded-full border border-ink-black/20 px-3 py-1.5 font-medium text-ink-black hover:bg-ink-black/5 disabled:opacity-40 disabled:pointer-events-none"
                aria-label="Previous page"
              >
                <ChevronLeft size={16} />
                Previous
              </button>
              <span className="px-2 tabular-nums text-ink-black/60">
                Page {txPageSafe} of {txTotalPages}
              </span>
              <button
                type="button"
                onClick={() => setTxPage((p) => Math.min(txTotalPages, p + 1))}
                disabled={txPageSafe >= txTotalPages}
                className="inline-flex items-center gap-1 rounded-full border border-ink-black/20 px-3 py-1.5 font-medium text-ink-black hover:bg-ink-black/5 disabled:opacity-40 disabled:pointer-events-none"
                aria-label="Next page"
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </section>

      {zombies.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-6">
            <div className="w-2 h-2 rounded-full bg-signal-orange" />
            <h2 className="text-sm font-bold tracking-widest uppercase text-ink-black/60">
              Zombie subscriptions
            </h2>
          </div>
          <p className="text-ink-black/60 text-sm mb-4">
            Recurring charges with no activity in the last 30 days.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {zombies.map(
              (z: { id: string; category: string; amount: number; last_activity: string }) => (
                <div key={z.id} className="card border border-signal-orange/20">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-medium">{z.category}</h3>
                    <AlertTriangle className="text-signal-orange shrink-0" size={24} />
                  </div>
                  <p className="text-2xl font-medium mb-2">${Math.abs(z.amount)}</p>
                  <p className="text-sm text-ink-black/60 mb-4">Last activity: {z.last_activity}</p>
                  <button type="button" className="consent-button w-full">
                    Review subscription
                  </button>
                </div>
              )
            )}
          </div>
        </section>
      )}

      {isPluginActive('ai_prediction') && forecast.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-light-signal-orange" />
            <h2 className="text-sm font-bold tracking-widest uppercase text-ink-black/60">
              AI cashflow forecast
            </h2>
          </div>
          <div className="card h-80 md:h-96 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forecast}>
                <CartesianGrid strokeDasharray="3 3" stroke="#14141320" vertical={false} />
                <XAxis dataKey="month" stroke="#14141360" axisLine={false} tickLine={false} />
                <YAxis stroke="#14141360" axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 20,
                    border: 'none',
                    boxShadow: 'rgba(0, 0, 0, 0.08) 0px 24px 48px 0px',
                  }}
                  formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Projected']}
                />
                <Line
                  type="monotone"
                  dataKey="projected_cashflow"
                  stroke="#CF4500"
                  strokeWidth={3}
                  dot={{ r: 6, fill: '#CF4500', strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {isPluginActive('expense_categorizer') && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-ink-black" />
            <h2 className="text-sm font-bold tracking-widest uppercase text-ink-black/60">
              Smart Categorizer
            </h2>
          </div>
          <div className="card p-6">
            <form onSubmit={(e) => void handleSearch(e)} className="flex flex-col sm:flex-row gap-4 mb-6">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder='Try "cloud" or a category name'
                className="flex-1 bg-transparent border-b-2 border-ink-black/20 pb-2 outline-none text-lg focus:border-ink-black transition-colors"
              />
              <button type="submit" className="pill-button shrink-0">
                Search
              </button>
            </form>
            {searchResults.length > 0 && (
              <ul className="space-y-3">
                {searchResults.map(
                  (r: { id: string; category: string; date: string; amount: number }) => (
                    <li
                      key={r.id}
                      className="flex justify-between items-center p-4 rounded-2xl bg-canvas-cream"
                    >
                      <div>
                        <div className="font-medium">{r.category}</div>
                        <div className="text-sm text-ink-black/60">{r.date}</div>
                      </div>
                      <div className="font-semibold">
                        ${Math.abs(r.amount).toLocaleString()}
                      </div>
                    </li>
                  )
                )}
              </ul>
            )}
          </div>
        </section>
      )}

      {showTransaction && (
        <TransactionShowModal
          transaction={showTransaction}
          onClose={() => setShowTransaction(null)}
        />
      )}
    </div>
  );
}
