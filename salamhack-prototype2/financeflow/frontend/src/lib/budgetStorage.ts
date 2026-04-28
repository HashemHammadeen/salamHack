import type { BudgetLedgerEntry, BudgetMonthlyLine, BudgetScheduledBill, BudgetState } from '../types/budget';
import { defaultBudgetState } from '../types/budget';
import { getItemMigrated, setItemMigrated } from './localStorageScope';

const STORAGE_KEY = 'ff_budget_cashflow_v1';

function parseLine(raw: unknown): BudgetMonthlyLine | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  const type = o.type === 'income' || o.type === 'expense' ? o.type : null;
  if (!type) return null;
  const id = typeof o.id === 'string' && o.id ? o.id : crypto.randomUUID();
  const label = typeof o.label === 'string' ? o.label : '';
  const amt = typeof o.amount === 'number' ? o.amount : parseFloat(String(o.amount));
  return {
    id,
    type,
    label,
    amount: Number.isFinite(amt) && amt >= 0 ? amt : 0,
    category: typeof o.category === 'string' ? o.category : 'General',
    isFixed: Boolean(o.isFixed),
  };
}

function parseScheduled(raw: unknown): BudgetScheduledBill | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  const id = typeof o.id === 'string' && o.id ? o.id : crypto.randomUUID();
  const label = typeof o.label === 'string' ? o.label : '';
  const amt = typeof o.amount === 'number' ? o.amount : parseFloat(String(o.amount));
  const due = typeof o.dueDate === 'string' ? o.dueDate : '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(due)) return null;
  return {
    id,
    label,
    amount: Number.isFinite(amt) && amt >= 0 ? amt : 0,
    dueDate: due,
  };
}

function parseLedger(raw: unknown): BudgetLedgerEntry | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  const type = o.type === 'income' || o.type === 'expense' ? o.type : null;
  if (!type) return null;
  const id = typeof o.id === 'string' && o.id ? o.id : crypto.randomUUID();
  const date = typeof o.date === 'string' ? o.date : '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const label = typeof o.label === 'string' ? o.label : '';
  const amt = typeof o.amount === 'number' ? o.amount : parseFloat(String(o.amount));
  return {
    id,
    date,
    type,
    label,
    amount: Number.isFinite(amt) && amt >= 0 ? amt : 0,
    category: typeof o.category === 'string' ? o.category : 'General',
  };
}

export function loadBudget(): BudgetState {
  if (typeof localStorage === 'undefined') return defaultBudgetState();
  try {
    const raw = getItemMigrated(STORAGE_KEY);
    if (!raw) return defaultBudgetState();
    const j = JSON.parse(raw) as unknown;
    if (!j || typeof j !== 'object' || Array.isArray(j)) return defaultBudgetState();
    const b = j as Record<string, unknown>;
    const monthlyRaw = b.monthlyLines;
    const schedRaw = b.scheduledBills;
    const ledgerRaw = b.ledger;
    const monthlyLines = Array.isArray(monthlyRaw)
      ? (monthlyRaw.map(parseLine).filter(Boolean) as BudgetMonthlyLine[])
      : [];
    const scheduledBills = Array.isArray(schedRaw)
      ? (schedRaw.map(parseScheduled).filter(Boolean) as BudgetScheduledBill[])
      : [];
    const ledger = Array.isArray(ledgerRaw)
      ? (ledgerRaw.map(parseLedger).filter(Boolean) as BudgetLedgerEntry[])
      : [];
      
    if (monthlyLines.length === 0 && scheduledBills.length === 0 && ledger.length === 0) {
      return defaultBudgetState();
    }
    
    return { monthlyLines, scheduledBills, ledger };
  } catch {
    return defaultBudgetState();
  }
}

export function saveBudget(state: BudgetState): void {
  setItemMigrated(STORAGE_KEY, JSON.stringify(state));
}

export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/** Bills with due date in the next `days` days (inclusive of today), forward window. */
export function sumScheduledDueWithin(
  bills: BudgetScheduledBill[],
  days: number,
  from: Date = new Date()
): { total: number; count: number; items: BudgetScheduledBill[] } {
  const end = new Date(from);
  end.setHours(0, 0, 0, 0);
  end.setDate(end.getDate() + days);
  const start = new Date(from);
  start.setHours(0, 0, 0, 0);
  const items = bills.filter((b) => {
    const d = new Date(b.dueDate + 'T12:00:00');
    return d >= start && d <= end;
  });
  const total = items.reduce((s, b) => s + b.amount, 0);
  return { total, count: items.length, items };
}

export function ymdInMonth(ym: string, dateStr: string): boolean {
  return dateStr.startsWith(ym);
}
