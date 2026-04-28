import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { useFinanceData } from '../context/FinanceDataContext';
import { buildChartSeries } from '../lib/financeCharts';

export default function Overview() {
  const { transactions, taxReserve, isPluginActive } = useFinanceData();

  const series = useMemo(() => buildChartSeries(transactions), [transactions]);
  const maxKpi = Math.max(series.totalInflow, series.totalOutflow, 1);
  const inflowPct = (series.totalInflow / maxKpi) * 100;
  const outflowPct = (series.totalOutflow / maxKpi) * 100;
  const maxTxAbs =
    transactions.length === 0
      ? 1
      : Math.max(...transactions.map((t: { amount: number }) => Math.abs(t.amount)), 1);

  const taxPlugin = isPluginActive('tax_calculator') && taxReserve ? taxReserve : null;

  return (
    <div className="space-y-12 max-w-5xl">
      <section>
        <h1 className="mb-4 text-4xl md:text-5xl lg:text-6xl leading-tight max-w-2xl">
          Financial clarity
          <br />
          at a glance.
        </h1>
        <p className="text-lg text-ink-black/80 max-w-md mb-8">
          Snapshot of your finances: inflow, outflow, and recent activity. Use the sidebar for
          detailed analytics, contacts, and transactions.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link to="/analytics" className="pill-button inline-flex items-center gap-2 no-underline">
            Open analytics <ArrowRight size={16} />
          </Link>
          <Link to="/activity" className="pill-button-secondary no-underline inline-block">
            Review activity
          </Link>
        </div>
      </section>

      <section>
        <div className="flex items-center gap-2 mb-6">
          <div className="w-2 h-2 rounded-full bg-light-signal-orange" />
          <h2 className="text-sm font-bold tracking-widest uppercase text-ink-black/60">
            Today&apos;s snapshot
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          <div className="card p-6 bg-lifted-cream">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-ink-black/60">Total inflow</span>
              <TrendingUp className="text-light-signal-orange" size={20} />
            </div>
            <p className="text-3xl font-medium tracking-tight">
              ${series.totalInflow.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
            <div className="mt-4 h-2 rounded-full bg-ink-black/10 overflow-hidden">
              <div
                className="h-full bg-light-signal-orange rounded-full transition-all"
                style={{ width: `${inflowPct}%` }}
              />
            </div>
          </div>
          <div className="card p-6 bg-lifted-cream">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-ink-black/60">Total outflow</span>
              <TrendingDown className="text-signal-orange" size={20} />
            </div>
            <p className="text-3xl font-medium tracking-tight">
              ${series.totalOutflow.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
            <div className="mt-4 h-2 rounded-full bg-ink-black/10 overflow-hidden">
              <div
                className="h-full bg-signal-orange rounded-full transition-all"
                style={{ width: `${outflowPct}%` }}
              />
            </div>
          </div>
          <div className="card p-6 bg-lifted-cream">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-ink-black/60">Net position</span>
              <Activity className="text-ink-black/70" size={20} />
            </div>
            <p
              className={`text-3xl font-medium tracking-tight ${series.net >= 0 ? 'text-ink-black' : 'text-signal-orange'}`}
            >
              {series.net >= 0 ? '' : '−'}
              ${Math.abs(series.net).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
            <p className="text-sm text-ink-black/50 mt-2">Income minus expenses</p>
          </div>
          <div className="card p-6 bg-lifted-cream">
            <span className="text-sm text-ink-black/60 block mb-3">Transaction count</span>
            <p className="text-3xl font-medium tracking-tight">{transactions.length}</p>
            <p className="text-sm text-ink-black/50 mt-2">In current dataset</p>
            <div className="mt-4 flex gap-1 h-10 items-end">
              {transactions.length === 0 ? (
                <p className="text-xs text-ink-black/40 w-full">No activity yet.</p>
              ) : (
                transactions.slice(-12).map((t: { id: string; amount: number; category: string }) => {
                  const h = (Math.abs(t.amount) / maxTxAbs) * 100;
                  return (
                    <div
                      key={t.id}
                      className="flex-1 min-w-0 rounded-t-md"
                      style={{
                        height: `${Math.max(10, h)}%`,
                        backgroundColor:
                          t.amount < 0 ? 'rgba(207, 69, 0, 0.55)' : 'rgba(243, 115, 56, 0.65)',
                      }}
                      title={`${t.category}`}
                    />
                  );
                })
              )}
            </div>
          </div>
        </div>

        {taxPlugin && (
          <div className="mt-10 pt-8 border-t border-ink-black/10">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-signal-orange" />
              <h3 className="text-sm font-bold tracking-widest uppercase text-ink-black/60">Plugins</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="card relative overflow-hidden max-w-md w-full">
                <div className="absolute top-0 right-0 p-4">
                  <span className="text-xs font-bold tracking-widest text-signal-orange uppercase">
                    Plugin
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-signal-orange" />
                  <h4 className="text-sm font-bold tracking-widest uppercase text-ink-black/60">
                    Tax reserve
                  </h4>
                </div>
                <p className="text-2xl font-medium mb-4">
                  ${taxPlugin.tax_reserve.toLocaleString()}
                </p>
                <div className="w-full bg-ink-black/10 rounded-full h-2 mb-2">
                  <div
                    className="bg-signal-orange h-2 rounded-full"
                    style={{ width: `${taxPlugin.tax_rate * 100}%` }}
                  />
                </div>
                <p className="text-sm text-ink-black/60 text-right">
                  {taxPlugin.tax_rate * 100}% of ${taxPlugin.total_income.toLocaleString()} income
                </p>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
