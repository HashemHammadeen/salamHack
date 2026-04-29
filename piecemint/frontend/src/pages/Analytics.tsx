import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell,
  Legend,
} from 'recharts';
import { useFinanceData } from '../context/FinanceDataContext';
import {
  buildChartSeries,
  chartTooltipProps,
  INK,
  ORANGE,
  LIGHT_ORANGE,
  MUTED,
  TAUPE,
} from '../lib/financeCharts';

/** Highlight for top counterparty bar (Recharts fills). */
const TOP_BAR_ORANGE = '#f1713b';

const chartCardClass =
  'card flex h-80 min-h-0 flex-col overflow-hidden p-4 md:p-6';
/** Slightly taller than standard cards for readable top-category labels. */
const categoryChartCardClass =
  'card flex h-[24rem] min-h-0 flex-col overflow-hidden p-4 md:h-[26rem] md:p-6';
const chartBodyClass = 'min-h-0 flex-1 w-full';

function renderClientTick(props: {
  x?: number | string;
  y?: number | string;
  payload?: { value?: string };
}) {
  const x = Number(props.x ?? 0);
  const y = Number(props.y ?? 0);
  const full = String(props.payload?.value ?? '');
  const short = full.length > 24 ? `${full.slice(0, 22)}…` : full;
  return (
    <g transform={`translate(${x},${y})`}>
      <title>{full}</title>
      <text x={0} y={0} dy={3} textAnchor="end" fill={MUTED} fontSize={10}>
        {short}
      </text>
    </g>
  );
}

function renderSupplierTick(props: {
  x?: number | string;
  y?: number | string;
  payload?: { value?: string };
}) {
  const x = Number(props.x ?? 0);
  const y = Number(props.y ?? 0);
  const full = String(props.payload?.value ?? '');
  const short = full.length > 30 ? `${full.slice(0, 28)}…` : full;
  return (
    <g transform={`translate(${x},${y})`}>
      <title>{full}</title>
      <text x={0} y={0} dy={3} textAnchor="end" fill={MUTED} fontSize={10}>
        {short}
      </text>
    </g>
  );
}

export default function Analytics() {
  const { clients, suppliers, transactions } = useFinanceData();

  const series = useMemo(() => buildChartSeries(transactions), [transactions]);
  const clientBars = useMemo(
    () =>
      clients
        .map((c: { name: string; total_billed: number }) => ({
          name: c.name,
          total: c.total_billed,
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 8),
    [clients]
  );
  const supplierBars = useMemo(
    () =>
      suppliers
        .map((s: { name: string; total_billed: number }) => ({
          name: s.name,
          total: s.total_billed,
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 8),
    [suppliers]
  );
  const categoryBarsTop = useMemo(() => series.categoryBars.slice(0, 10), [series.categoryBars]);

  const maxClientBilled = useMemo(
    () => (clientBars.length === 0 ? 0 : Math.max(...clientBars.map((b) => b.total))),
    [clientBars]
  );

  return (
    <div className="w-full space-y-10">
      <header>
        <h1 className="text-3xl md:text-4xl font-medium tracking-tight mb-2">Cash & analytics</h1>
        <p className="text-ink-black/70 max-w-2xl">
          Charts built from your transactions: monthly flow, inflow vs outflow, spend by category,
          and revenue or spend by counterparty.
        </p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className={chartCardClass}>
          <h2 className="text-lg font-medium mb-1 shrink-0">Cash flow (net by month)</h2>
          <p className="text-sm text-ink-black/50 mb-3 shrink-0">Net amount by calendar month</p>
          {series.cashflowByMonth.length === 0 ? (
            <p className="text-ink-black/50 text-sm flex-1 flex items-center justify-center text-center">
              No transaction data yet.
            </p>
          ) : (
            <div className={chartBodyClass}>
              <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series.cashflowByMonth} margin={{ top: 8, right: 8, left: 4, bottom: 4 }}>
                <defs>
                  <linearGradient id="ffFlowA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={LIGHT_ORANGE} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={LIGHT_ORANGE} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={`${INK}20`} vertical={false} />
                <XAxis dataKey="month" tick={{ fill: MUTED, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fill: MUTED, fontSize: 11 }}
                  tickFormatter={(v) => `$${v}`}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip {...chartTooltipProps} formatter={(v) => [`$${Number(v ?? 0).toFixed(2)}`, 'Net']} />
                <Area type="monotone" dataKey="amount" name="Net" stroke={ORANGE} strokeWidth={2} fill="url(#ffFlowA)" />
              </AreaChart>
            </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className={chartCardClass}>
          <h2 className="text-lg font-medium mb-1 shrink-0">Inflow vs outflow</h2>
          <p className="text-sm text-ink-black/50 mb-3 shrink-0">By month</p>
          {series.inOutBars.length === 0 ? (
            <p className="text-ink-black/50 text-sm flex-1 flex items-center justify-center text-center">No data.</p>
          ) : (
            <div className={chartBodyClass}>
              <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={series.inOutBars}
                margin={{ top: 8, right: 8, left: 4, bottom: 4 }}
                barCategoryGap="18%"
              >
                <CartesianGrid strokeDasharray="3 3" stroke={`${INK}20`} vertical={false} />
                <XAxis dataKey="month" tick={{ fill: MUTED, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fill: MUTED, fontSize: 11 }}
                  tickFormatter={(v) => `$${v}`}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip {...chartTooltipProps} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Bar dataKey="inflow" name="Inflow" fill={LIGHT_ORANGE} radius={[8, 8, 0, 0]} maxBarSize={40} />
                <Bar dataKey="outflow" name="Outflow" fill={INK} radius={[8, 8, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 xl:items-start gap-8">
        <div className={categoryChartCardClass}>
          <h2 className="text-lg font-medium mb-1 shrink-0">Expenses by category</h2>
          <p className="text-sm text-ink-black/50 mb-3 shrink-0">Top 10 categories by absolute spend</p>
          {categoryBarsTop.length === 0 ? (
            <p className="text-ink-black/50 text-sm flex-1 flex items-center justify-center text-center">
              No expenses yet.
            </p>
          ) : (
            <div className={chartBodyClass}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={categoryBarsTop}
                  margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
                  barCategoryGap="16%"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={`${INK}20`} horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fill: MUTED, fontSize: 11 }}
                    tickFormatter={(v) => (v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v}`)}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    dataKey="category"
                    type="category"
                    width={190}
                    interval={0}
                    tickMargin={6}
                    tick={{ fill: MUTED, fontSize: 10 }}
                    tickFormatter={(v) =>
                      typeof v === 'string' && v.length > 30 ? `${v.slice(0, 28)}…` : String(v)
                    }
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip {...chartTooltipProps} formatter={(v) => [`$${Number(v ?? 0).toLocaleString()}`, 'Spend']} />
                  <Bar dataKey="value" name="Spend" fill={ORANGE} radius={[0, 8, 8, 0]} maxBarSize={22}>
                    {categoryBarsTop.map((_, i) => (
                      <Cell key={i} fill={i % 2 === 0 ? ORANGE : LIGHT_ORANGE} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className={chartCardClass}>
          <h2 className="text-lg font-medium mb-1 shrink-0">Revenue by client</h2>
          <p className="text-sm text-ink-black/50 mb-3 shrink-0">Total billed</p>
          {clientBars.length === 0 ? (
            <p className="text-ink-black/50 text-sm flex-1 flex items-center justify-center text-center">No clients.</p>
          ) : (
            <div className={chartBodyClass}>
              <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={clientBars}
                margin={{ top: 8, right: 18, left: 8, bottom: 8 }}
                barCategoryGap="18%"
              >
                <CartesianGrid strokeDasharray="3 3" stroke={`${INK}20`} horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fill: MUTED, fontSize: 11 }}
                  tickFormatter={(v) => (v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`)}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={170}
                  interval={0}
                  tickMargin={6}
                  tick={renderClientTick}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip {...chartTooltipProps} formatter={(v) => [`$${Number(v ?? 0).toLocaleString()}`, 'Billed']} />
                <Bar dataKey="total" name="Billed" fill={INK} radius={[0, 8, 8, 0]} maxBarSize={28}>
                  {clientBars.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={
                        maxClientBilled > 0 && entry.total === maxClientBilled
                          ? TOP_BAR_ORANGE
                          : INK
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            </div>
          )}
        </div>
        {supplierBars.length > 0 && (
          <div className={`${chartCardClass} xl:col-span-2`}>
            <h2 className="text-lg font-medium mb-1 shrink-0">Spend by supplier</h2>
            <p className="text-sm text-ink-black/50 mb-3 shrink-0">Total billed to vendors</p>
            <div className={chartBodyClass}>
              <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={supplierBars}
                margin={{ top: 8, right: 18, left: 8, bottom: 8 }}
                barCategoryGap="18%"
              >
                <CartesianGrid strokeDasharray="3 3" stroke={`${INK}20`} horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fill: MUTED, fontSize: 11 }}
                  tickFormatter={(v) => (v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`)}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={190}
                  interval={0}
                  tickMargin={6}
                  tick={renderSupplierTick}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip {...chartTooltipProps} formatter={(v) => [`$${Number(v ?? 0).toLocaleString()}`, 'Billed']} />
                <Bar
                  dataKey="total"
                  name="Billed"
                  fill={TAUPE}
                  stroke={INK}
                  strokeOpacity={0.2}
                  strokeWidth={1}
                  radius={[0, 8, 8, 0]}
                  maxBarSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
