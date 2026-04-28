export const INK = '#141413';
export const ORANGE = '#CF4500';
export const LIGHT_ORANGE = '#F37338';
export const MUTED = '#696969';
export const TAUPE = '#D1CDC7';

export const chartTooltipProps = {
  contentStyle: {
    borderRadius: 20,
    border: 'none',
    boxShadow: 'rgba(0, 0, 0, 0.08) 0px 24px 48px 0px',
  },
} as const;

export function buildChartSeries(transactions: {
  amount: number;
  date: string;
  type: string;
  category: string;
}[]) {
  const totalInflow = transactions.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const totalOutflow = transactions.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const net = totalInflow - totalOutflow;

  const byMonth: Record<string, number> = {};
  for (const t of transactions) {
    const m = t.date.slice(0, 7);
    byMonth[m] = (byMonth[m] || 0) + t.amount;
  }
  const cashflowByMonth = Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, amount]) => ({ month, amount }));

  const expenseByCategory: Record<string, number> = {};
  for (const t of transactions) {
    if (t.amount < 0) {
      expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + Math.abs(t.amount);
    }
  }
  const categoryBars = Object.entries(expenseByCategory)
    .map(([category, value]) => ({ category, value }))
    .sort((a, b) => b.value - a.value);

  const inflowByMonth: Record<string, number> = {};
  const outflowByMonth: Record<string, number> = {};
  for (const t of transactions) {
    const m = t.date.slice(0, 7);
    if (t.amount >= 0) inflowByMonth[m] = (inflowByMonth[m] || 0) + t.amount;
    else outflowByMonth[m] = (outflowByMonth[m] || 0) + Math.abs(t.amount);
  }
  const months = new Set([...Object.keys(inflowByMonth), ...Object.keys(outflowByMonth)]);
  const inOutBars = [...months].sort().map((m) => ({
    month: m,
    inflow: inflowByMonth[m] || 0,
    outflow: outflowByMonth[m] || 0,
  }));

  return { totalInflow, totalOutflow, net, cashflowByMonth, categoryBars, inOutBars };
}
