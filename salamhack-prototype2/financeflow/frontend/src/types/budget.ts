/** Recurring monthly income or expense line. */
export type BudgetMonthlyLine = {
  id: string;
  type: 'income' | 'expense';
  label: string;
  amount: number;
  /** Expense category for charts (ignored for income). */
  category: string;
  /** Expense: fixed (subscriptions, rent) vs variable; ignored for income. */
  isFixed: boolean;
};

/** One-time or dated ledger entry (current-month adjustments + history). */
export type BudgetLedgerEntry = {
  id: string;
  date: string; // YYYY-MM-DD
  type: 'income' | 'expense';
  label: string;
  amount: number;
  category: string;
};

/** Upcoming bill due date — used for safe-to-spend reserve. */
export type BudgetScheduledBill = {
  id: string;
  label: string;
  amount: number;
  dueDate: string; // YYYY-MM-DD
};

export type BudgetState = {
  monthlyLines: BudgetMonthlyLine[];
  scheduledBills: BudgetScheduledBill[];
  ledger: BudgetLedgerEntry[];
};

export function defaultBudgetState(): BudgetState {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dStr = String(d.getDate()).padStart(2, '0');
  
  const today = `${y}-${m}-${dStr}`;
  const fiveDaysAgo = `${y}-${m}-${String(Math.max(1, d.getDate() - 5)).padStart(2, '0')}`;
  const tenDaysAgo = `${y}-${m}-${String(Math.max(1, d.getDate() - 10)).padStart(2, '0')}`;
  const tomorrow = `${y}-${m}-${String(Math.min(28, d.getDate() + 1)).padStart(2, '0')}`;
  const nextWeek = `${y}-${m}-${String(Math.min(28, d.getDate() + 7)).padStart(2, '0')}`;

  return {
    monthlyLines: [
      { id: 'm1', type: 'income', label: 'Primary Salary', amount: 8500, category: '—', isFixed: false },
      { id: 'm2', type: 'income', label: 'Side Hustle', amount: 1200, category: '—', isFixed: false },
      { id: 'm3', type: 'expense', label: 'Office Rent', amount: 2000, category: 'Housing', isFixed: true },
      { id: 'm4', type: 'expense', label: 'SaaS Subscriptions', amount: 350, category: 'Software', isFixed: true },
      { id: 'm5', type: 'expense', label: 'Insurance', amount: 400, category: 'Insurance', isFixed: true },
    ],
    scheduledBills: [
      { id: 's1', label: 'Corporate Credit Card', amount: 1250.50, dueDate: tomorrow },
      { id: 's2', label: 'Internet & Phones', amount: 180.00, dueDate: nextWeek },
    ],
    ledger: [
      { id: 'l1', date: today, type: 'expense', label: 'Team Lunch', amount: 145.20, category: 'Meals' },
      { id: 'l2', date: today, type: 'expense', label: 'Office Supplies', amount: 89.99, category: 'Equipment' },
      { id: 'l3', date: fiveDaysAgo, type: 'income', label: 'Consulting Retainer', amount: 3000, category: '—' },
      { id: 'l4', date: tenDaysAgo, type: 'expense', label: 'Flight to Conference', amount: 650, category: 'Travel' },
      { id: 'l5', date: tenDaysAgo, type: 'expense', label: 'Hotel Booking', amount: 420, category: 'Travel' },
    ],
  };
}
