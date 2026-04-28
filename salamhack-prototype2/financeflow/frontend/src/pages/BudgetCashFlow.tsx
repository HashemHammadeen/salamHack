import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Pencil, Plus, Trash2, Wallet, Shield } from 'lucide-react';
import type {
  BudgetLedgerEntry,
  BudgetMonthlyLine,
  BudgetScheduledBill,
  BudgetState,
} from '../types/budget';
import { defaultBudgetState } from '../types/budget';
import {
  loadBudget,
  newId,
  saveBudget,
  sumScheduledDueWithin,
  ymdInMonth,
} from '../lib/budgetStorage';
import { INK, LIGHT_ORANGE, MUTED, ORANGE, TAUPE, chartTooltipProps } from '../lib/financeCharts';

const DONUT_COLORS = [ORANGE, LIGHT_ORANGE, TAUPE, '#8B8B85', '#5C5C58', MUTED, INK];
const UPCOMING_DAYS = 7;

function money(n: number): string {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(n);
}

function currentYm(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function todayYmd(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function BudgetCashFlow() {
  const [state, setState] = useState<BudgetState>(() => defaultBudgetState());

  useEffect(() => {
    setState(loadBudget());
  }, []);

  const persist = useCallback((next: BudgetState | ((p: BudgetState) => BudgetState)) => {
    setState((prev) => {
      const n = typeof next === 'function' ? next(prev) : next;
      saveBudget(n);
      return n;
    });
  }, []);

  const ym = useMemo(() => currentYm(), []);

  const { totalIncome, totalExpense, fixedMonthly, incomeUtilPercent, categoryRows } = useMemo(() => {
    const incM = state.monthlyLines.filter((l) => l.type === 'income');
    const expM = state.monthlyLines.filter((l) => l.type === 'expense');
    const ledgerInMonth = state.ledger.filter((e) => ymdInMonth(ym, e.date));

    const inc =
      incM.reduce((s, l) => s + l.amount, 0) +
      ledgerInMonth.filter((e) => e.type === 'income').reduce((s, e) => s + e.amount, 0);
    const exp =
      expM.reduce((s, l) => s + l.amount, 0) +
      ledgerInMonth.filter((e) => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
    const fixed = expM.filter((l) => l.isFixed).reduce((s, l) => s + l.amount, 0);

    const byCat: Record<string, number> = {};
    for (const l of expM) {
      const c = l.category.trim() || 'General';
      byCat[c] = (byCat[c] || 0) + l.amount;
    }
    for (const e of ledgerInMonth) {
      if (e.type !== 'expense') continue;
      const c = e.category.trim() || 'General';
      byCat[c] = (byCat[c] || 0) + e.amount;
    }
    const categoryRows = Object.entries(byCat)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const util = inc > 0 ? Math.min(100, (exp / inc) * 100) : 0;
    return {
      totalIncome: inc,
      totalExpense: exp,
      fixedMonthly: fixed,
      incomeUtilPercent: util,
      categoryRows,
    };
  }, [state, ym]);

  const netSavings = totalIncome - totalExpense;
  const { total: upcomingBills, items: upcomingItems } = useMemo(
    () => sumScheduledDueWithin(state.scheduledBills, UPCOMING_DAYS),
    [state.scheduledBills]
  );
  const safeToSpend = Math.max(0, netSavings - upcomingBills);

  const donutData = useMemo(
    () =>
      categoryRows.map((row, i) => ({
        ...row,
        fill: DONUT_COLORS[i % DONUT_COLORS.length],
      })),
    [categoryRows]
  );

  return (
    <div className="space-y-10 max-w-6xl">
      <header>
        <h1 className="text-3xl md:text-4xl font-medium tracking-tight mb-2">Budgeting & cash flow</h1>
        <p className="text-ink-black/70 max-w-2xl">
          Plan monthly income and expenses, set aside for upcoming bills, and keep a real-time log.
          Data is stored in this browser on this device.
        </p>
      </header>

      <section
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
        aria-label="Summary"
      >
        <SummaryCard label="Total monthly income" value={totalIncome} accent="border-t-4 border-t-[var(--color-signal-orange)]" />
        <SummaryCard
          label="Fixed expenses (recurring)"
          value={fixedMonthly}
          sub="Recurring items marked fixed"
          accent="border-t-4 border-t-[#5C5C58]"
        />
        <SummaryCard
          label="Net monthly savings"
          value={netSavings}
          sub="Income minus all expenses (this month + recurring)"
          accent="border-t-4 border-t-[#2d6a4f]"
        />
        <SummaryCard
          label="Safe to spend"
          value={safeToSpend}
          accent="border-t-4 border-t-[#1a659e]"
          icon={<Shield size={20} className="text-ink-black/25 shrink-0" aria-hidden />}
          statusRole
          sub={
            <>
              After recurring &amp; this month’s entries, minus{' '}
              <span className="font-medium text-ink-black">{money(upcomingBills)}</span> in bills due in the
              next {UPCOMING_DAYS} days
              {upcomingItems.length > 0
                ? ` (${upcomingItems.length} bill${upcomingItems.length > 1 ? 's' : ''})`
                : ''}
              .
            </>
          }
        />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card p-5 md:p-6 space-y-4">
          <h2 className="text-lg font-medium">Income vs expenses (this month)</h2>
          <p className="text-sm text-ink-black/50">
            Share of income used by all expenses in the current month (recurring + dated entries in{' '}
            {ym}).
          </p>
          <div className="space-y-2">
            <div
              className="h-4 rounded-full bg-ink-black/10 overflow-hidden"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(incomeUtilPercent)}
            >
              <div
                className="h-full rounded-full transition-[width] duration-500 ease-out"
                style={{
                  width: `${incomeUtilPercent}%`,
                  backgroundColor: incomeUtilPercent > 90 ? '#b91c1c' : ORANGE,
                }}
              />
            </div>
            <div className="flex justify-between text-sm text-ink-black/60">
              <span>Utilization</span>
              <span className="font-medium text-ink-black tabular-nums">
                {incomeUtilPercent.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        <div className="card p-5 md:p-6 min-h-[280px] flex flex-col">
          <h2 className="text-lg font-medium mb-1">Spending by category</h2>
          <p className="text-sm text-ink-black/50 mb-2">Recurring and one-time expenses in {ym}</p>
          {donutData.length === 0 ? (
            <p className="text-sm text-ink-black/45 flex-1 flex items-center justify-center text-center">
              Add expenses with a category to see a breakdown.
            </p>
          ) : (
            <div className="flex-1 min-h-0 w-full min-w-0 flex flex-col sm:flex-row items-center gap-4">
              <div className="h-52 w-52 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius="58%"
                      outerRadius="90%"
                      paddingAngle={2}
                    >
                      {donutData.map((_, i) => (
                        <Cell key={i} fill={donutData[i].fill} stroke="var(--color-lifted-cream)" />
                      ))}
                    </Pie>
                    <Tooltip
                      {...chartTooltipProps}
                      formatter={(v) => [money(Number(v ?? 0)), '']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="w-full min-w-0 text-sm space-y-2" aria-label="Category list">
                {categoryRows.map((r, i) => (
                  <li key={r.name} className="flex justify-between gap-2 border-b border-ink-black/10 pb-1.5 last:border-0">
                    <span className="flex items-center gap-2 min-w-0">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }}
                        aria-hidden
                      />
                      <span className="truncate">{r.name}</span>
                    </span>
                    <span className="tabular-nums text-ink-black/80 shrink-0">{money(r.value)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <MonthlyPlanSection state={state} onChange={persist} />
        <ScheduledBillsSection state={state} onChange={persist} />
      </div>

      <LedgerSection ym={ym} state={state} onChange={persist} />
    </div>
  );
}

function SummaryCard({
  label,
  value,
  sub,
  accent,
  icon,
  statusRole,
}: {
  label: string;
  value: number;
  sub?: string | ReactNode;
  accent: string;
  icon?: ReactNode;
  /** e.g. live region for safe-to-spend */
  statusRole?: boolean;
}) {
  return (
    <div className={`card p-5 md:p-6 ${accent}`} role={statusRole ? 'status' : undefined}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-bold tracking-widest uppercase text-ink-black/50">{label}</p>
        {icon ?? <Wallet size={20} className="text-ink-black/25 shrink-0" aria-hidden />}
      </div>
      <p className="text-2xl md:text-3xl font-medium tracking-tight mt-2 tabular-nums text-ink-black">
        {money(value)}
      </p>
      {sub != null && sub !== '' && <p className="text-sm text-ink-black/55 mt-2">{sub}</p>}
    </div>
  );
}

function MonthlyPlanSection({
  state,
  onChange,
}: {
  state: BudgetState;
  onChange: (f: (p: BudgetState) => BudgetState) => void;
}) {
  const [form, setForm] = useState({
    type: 'income' as 'income' | 'expense',
    label: '',
    amount: '',
    category: 'General',
    isFixed: true,
  });

  const add = () => {
    const amount = parseFloat(form.amount);
    if (!form.label.trim() || !Number.isFinite(amount) || amount < 0) return;
    const line: BudgetMonthlyLine = {
      id: newId(),
      type: form.type,
      label: form.label.trim(),
      amount,
      category: form.type === 'expense' ? (form.category.trim() || 'General') : '—',
      isFixed: form.type === 'expense' ? form.isFixed : false,
    };
    onChange((p) => ({ ...p, monthlyLines: [...p.monthlyLines, line] }));
    setForm((f) => ({ ...f, label: '', amount: '' }));
  };

  const remove = (id: string) => {
    onChange((p) => ({ ...p, monthlyLines: p.monthlyLines.filter((l) => l.id !== id) }));
  };

  return (
    <div className="card p-5 md:p-6 space-y-4">
      <h2 className="text-lg font-medium">Monthly plan</h2>
      <p className="text-sm text-ink-black/50">
        Recurring income and expenses. Remove a row when a payment is no longer part of your plan.
      </p>
      <div className="flex flex-col sm:flex-row flex-wrap gap-2 items-end">
        <label className="text-xs font-medium text-ink-black/60 block w-full sm:w-24">
          Type
          <select
            className="mt-1 w-full border border-ink-black/20 rounded-xl px-3 py-2 bg-white text-sm"
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as 'income' | 'expense' }))}
          >
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </label>
        <label className="text-xs font-medium text-ink-black/60 block flex-1 min-w-[120px]">
          Label
          <input
            className="mt-1 w-full border border-ink-black/20 rounded-xl px-3 py-2 text-sm"
            value={form.label}
            onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
            placeholder="Salary, rent, …"
          />
        </label>
        <label className="text-xs font-medium text-ink-black/60 block w-full sm:w-28">
          Amount
          <input
            type="number"
            min={0}
            step="0.01"
            className="mt-1 w-full border border-ink-black/20 rounded-xl px-3 py-2 text-sm tabular-nums"
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            placeholder="0"
          />
        </label>
        {form.type === 'expense' && (
          <>
            <label className="text-xs font-medium text-ink-black/60 block flex-1 min-w-[100px]">
              Category
              <input
                className="mt-1 w-full border border-ink-black/20 rounded-xl px-3 py-2 text-sm"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                placeholder="Housing, food"
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-ink-black/80 pb-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isFixed}
                onChange={(e) => setForm((f) => ({ ...f, isFixed: e.target.checked }))}
                className="rounded border-ink-black/30"
              />
              Fixed
            </label>
          </>
        )}
        <button
          type="button"
          onClick={add}
          className="pill-button inline-flex items-center justify-center gap-1.5 text-sm w-full sm:w-auto"
        >
          <Plus size={16} />
          Add
        </button>
      </div>
      <ul className="divide-y divide-ink-black/10 border border-ink-black/10 rounded-2xl overflow-hidden" role="list">
        {state.monthlyLines.length === 0 && (
          <li className="px-4 py-8 text-sm text-ink-black/45 text-center">No recurring lines yet.</li>
        )}
        {state.monthlyLines.map((l) => (
          <li
            key={l.id}
            className="px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-sm bg-white/50"
          >
            <div className="min-w-0">
              <span
                className={[
                  'inline-block text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded',
                  l.type === 'income' ? 'bg-emerald-100 text-emerald-900' : 'bg-orange-100 text-orange-900',
                ].join(' ')}
              >
                {l.type}
              </span>
              <span className="ml-2 font-medium">{l.label}</span>
              {l.type === 'expense' && (
                <span className="ml-1 text-ink-black/50">
                  · {l.category}
                  {l.isFixed && ' · fixed'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="tabular-nums font-medium">{money(l.amount)}</span>
              <button
                type="button"
                onClick={() => remove(l.id)}
                className="p-1.5 rounded-lg text-ink-black/50 hover:text-red-700 hover:bg-red-50"
                aria-label={`Remove ${l.label}`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ScheduledBillsSection({
  state,
  onChange,
}: {
  state: BudgetState;
  onChange: (f: (p: BudgetState) => BudgetState) => void;
}) {
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [due, setDue] = useState(todayYmd());

  const add = () => {
    const a = parseFloat(amount);
    if (!label.trim() || !Number.isFinite(a) || a < 0) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(due)) return;
    const b: BudgetScheduledBill = { id: newId(), label: label.trim(), amount: a, dueDate: due };
    onChange((p) => ({ ...p, scheduledBills: [...p.scheduledBills, b] }));
    setLabel('');
    setAmount('');
  };

  return (
    <div className="card p-5 md:p-6 space-y-4">
      <h2 className="text-lg font-medium">Upcoming scheduled bills</h2>
      <p className="text-sm text-ink-black/50">
        Used only for the safe-to-spend reserve (due within {UPCOMING_DAYS} days). Remove after paid or
        when no longer relevant.
      </p>
      <div className="flex flex-col sm:flex-row flex-wrap gap-2 items-end">
        <label className="text-xs font-medium text-ink-black/60 block flex-1 min-w-[120px]">
          Label
          <input
            className="mt-1 w-full border border-ink-black/20 rounded-xl px-3 py-2 text-sm"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Credit card, insurance"
          />
        </label>
        <label className="text-xs font-medium text-ink-black/60 block w-full sm:w-28">
          Amount
          <input
            type="number"
            min={0}
            step="0.01"
            className="mt-1 w-full border border-ink-black/20 rounded-xl px-3 py-2 text-sm"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </label>
        <label className="text-xs font-medium text-ink-black/60 block w-full sm:w-40">
          Due
          <input
            type="date"
            className="mt-1 w-full border border-ink-black/20 rounded-xl px-3 py-2 text-sm"
            value={due}
            onChange={(e) => setDue(e.target.value)}
          />
        </label>
        <button type="button" onClick={add} className="pill-button text-sm w-full sm:w-auto inline-flex items-center gap-1">
          <Plus size={16} />
          Add bill
        </button>
      </div>
      <ul className="divide-y divide-ink-black/10 border border-ink-black/10 rounded-2xl overflow-hidden">
        {state.scheduledBills.length === 0 && (
          <li className="px-4 py-6 text-sm text-ink-black/45 text-center">No upcoming bills listed.</li>
        )}
        {state.scheduledBills.map((b) => (
          <li
            key={b.id}
            className="px-4 py-2.5 flex items-center justify-between gap-2 text-sm bg-white/50"
          >
            <span>
              <span className="font-medium">{b.label}</span>
              <span className="text-ink-black/50 ml-2">Due {b.dueDate}</span>
            </span>
            <span className="flex items-center gap-2">
              <span className="tabular-nums">{money(b.amount)}</span>
              <button
                type="button"
                onClick={() => onChange((p) => ({ ...p, scheduledBills: p.scheduledBills.filter((x) => x.id !== b.id) }))}
                className="p-1.5 rounded-lg text-ink-black/50 hover:text-red-700"
                aria-label={`Remove ${b.label}`}
              >
                <Trash2 size={16} />
              </button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function LedgerSection({
  ym,
  state,
  onChange,
}: {
  ym: string;
  state: BudgetState;
  onChange: (f: (p: BudgetState) => BudgetState) => void;
}) {
  const [editing, setEditing] = useState<BudgetLedgerEntry | null>(null);
  const [editDraft, setEditDraft] = useState<{
    label: string;
    amount: string;
    date: string;
    category: string;
  } | null>(null);
  const [form, setForm] = useState({
    type: 'expense' as 'income' | 'expense',
    label: '',
    amount: '',
    category: 'General',
    date: todayYmd(),
  });

  const inMonth = state.ledger.filter((e) => ymdInMonth(ym, e.date));
  const sorted = [...inMonth].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));

  const add = () => {
    const a = parseFloat(form.amount);
    if (!form.label.trim() || !Number.isFinite(a) || a < 0) return;
    const entry: BudgetLedgerEntry = {
      id: newId(),
      date: form.date,
      type: form.type,
      label: form.label.trim(),
      amount: a,
      category: form.type === 'expense' ? (form.category.trim() || 'General') : '—',
    };
    onChange((p) => ({ ...p, ledger: [entry, ...p.ledger] }));
    setForm((f) => ({ ...f, label: '', amount: '' }));
  };

  const startEdit = (e: BudgetLedgerEntry) => {
    setEditing(e);
    setEditDraft({
      label: e.label,
      amount: String(e.amount),
      date: e.date,
      category: e.category,
    });
  };

  const saveEdit = () => {
    if (!editing || !editDraft) return;
    const a = parseFloat(editDraft.amount);
    if (!editDraft.label.trim() || !Number.isFinite(a) || a < 0 || !/^\d{4}-\d{2}-\d{2}$/.test(editDraft.date)) return;
    onChange((p) => ({
      ...p,
      ledger: p.ledger.map((e) =>
        e.id === editing.id
          ? {
              ...e,
              label: editDraft.label.trim(),
              amount: a,
              date: editDraft.date,
              category: e.type === 'expense' ? (editDraft.category.trim() || 'General') : e.category,
            }
          : e
      ),
    }));
    setEditing(null);
    setEditDraft(null);
  };

  return (
    <div className="card p-5 md:p-6 space-y-4">
      <h2 className="text-lg font-medium">This month: one-time entries &amp; log</h2>
      <p className="text-sm text-ink-black/50">
        Dated inflows and outflows for {ym} roll into the totals and category mix. Newest first.
      </p>
      <div className="flex flex-col lg:flex-row flex-wrap gap-2 items-end">
        <label className="text-xs font-medium text-ink-black/60 block w-full sm:w-24">
          Type
          <select
            className="mt-1 w-full border border-ink-black/20 rounded-xl px-3 py-2 bg-white text-sm"
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as 'income' | 'expense' }))}
          >
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </label>
        <label className="text-xs font-medium text-ink-black/60 block flex-1 min-w-[120px]">
          Label
          <input
            className="mt-1 w-full border border-ink-black/20 rounded-xl px-3 py-2 text-sm"
            value={form.label}
            onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
            placeholder="Bonus, one-off, …"
          />
        </label>
        <label className="text-xs font-medium text-ink-black/60 block w-full sm:w-28">
          Amount
          <input
            type="number"
            min={0}
            className="mt-1 w-full border border-ink-black/20 rounded-xl px-3 py-2 text-sm"
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
          />
        </label>
        <label className="text-xs font-medium text-ink-black/60 block w-full sm:w-40">
          Date
          <input
            type="date"
            className="mt-1 w-full border border-ink-black/20 rounded-xl px-3 py-2 text-sm"
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
          />
        </label>
        {form.type === 'expense' && (
          <label className="text-xs font-medium text-ink-black/60 block flex-1 min-w-[100px]">
            Category
            <input
              className="mt-1 w-full border border-ink-black/20 rounded-xl px-3 py-2 text-sm"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            />
          </label>
        )}
        <button type="button" onClick={add} className="pill-button text-sm w-full lg:w-auto inline-flex items-center gap-1">
          <Plus size={16} />
          Log entry
        </button>
      </div>

      <ul className="space-y-2" aria-label="Recent entries" role="list">
        {sorted.length === 0 && (
          <li className="text-sm text-ink-black/45 py-4 text-center">No dated entries in {ym} yet.</li>
        )}
        {sorted.map((e) => (
          <li
            key={e.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3 rounded-2xl border border-ink-black/10 bg-white/40"
          >
            {editing?.id === e.id && editDraft ? (
              <div className="flex flex-wrap gap-2 items-end w-full">
                <input
                  className="border border-ink-black/20 rounded-lg px-2 py-1 text-sm flex-1 min-w-[120px]"
                  value={editDraft.label}
                  onChange={(ev) => setEditDraft((d) => (d ? { ...d, label: ev.target.value } : d))}
                />
                <input
                  type="number"
                  className="border border-ink-black/20 rounded-lg px-2 py-1 text-sm w-28"
                  value={editDraft.amount}
                  onChange={(ev) => setEditDraft((d) => (d ? { ...d, amount: ev.target.value } : d))}
                />
                <input
                  type="date"
                  className="border border-ink-black/20 rounded-lg px-2 py-1 text-sm"
                  value={editDraft.date}
                  onChange={(ev) => setEditDraft((d) => (d ? { ...d, date: ev.target.value } : d))}
                />
                {e.type === 'expense' && (
                  <input
                    className="border border-ink-black/20 rounded-lg px-2 py-1 text-sm flex-1 min-w-[80px]"
                    value={editDraft.category}
                    onChange={(ev) => setEditDraft((d) => (d ? { ...d, category: ev.target.value } : d))}
                    placeholder="Category"
                  />
                )}
                <div className="flex gap-2">
                  <button type="button" onClick={saveEdit} className="pill-button text-xs py-1 px-3">
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(null);
                      setEditDraft(null);
                    }}
                    className="pill-button-secondary text-xs py-1 px-3"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="min-w-0 text-sm">
                  <span className="text-ink-black/50 tabular-nums mr-2">{e.date}</span>
                  <span
                    className={e.type === 'income' ? 'text-emerald-800 font-medium' : 'text-orange-900 font-medium'}
                  >
                    {e.type}
                  </span>
                  <span className="ml-2 font-medium">{e.label}</span>
                  {e.type === 'expense' && <span className="text-ink-black/50 ml-1">· {e.category}</span>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="tabular-nums font-medium">{money(e.amount)}</span>
                  <button
                    type="button"
                    onClick={() => startEdit(e)}
                    className="p-1.5 rounded-lg text-ink-black/50 hover:bg-ink-black/10"
                    aria-label={`Edit ${e.label}`}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange((p) => ({ ...p, ledger: p.ledger.filter((x) => x.id !== e.id) }))}
                    className="p-1.5 rounded-lg text-ink-black/50 hover:text-red-700"
                    aria-label={`Delete ${e.label}`}
                    >
                    <Trash2 size={16} />
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
