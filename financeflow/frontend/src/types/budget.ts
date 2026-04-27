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
  return {
    monthlyLines: [],
    scheduledBills: [],
    ledger: [],
  };
}
