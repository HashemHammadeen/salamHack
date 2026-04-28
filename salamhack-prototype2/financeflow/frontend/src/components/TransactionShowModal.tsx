export type TransactionRecord = {
  id: string;
  amount: number;
  date: string;
  type: string;
  category: string;
  is_recurring: boolean;
  last_activity: string;
};

type TransactionShowModalProps = {
  transaction: TransactionRecord;
  onClose: () => void;
};

function fmtAmount(amount: number) {
  const neg = amount < 0;
  const s = Math.abs(amount).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  return `${neg ? '−' : ''}$${s}`;
}

export default function TransactionShowModal({ transaction: t, onClose }: TransactionShowModalProps) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-ink-black/40 backdrop-blur-sm border-0 cursor-default w-full h-full"
        onClick={onClose}
        aria-label="Close"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="tx-show-title"
        className="relative w-full sm:max-w-md bg-canvas-cream sm:rounded-3xl shadow-2xl border border-ink-black/10 p-6 sm:p-8 outline-none max-h-[min(90vh,720px)] overflow-y-auto"
      >
        <div className="flex justify-between items-start gap-3 mb-6">
          <div>
            <p className="text-xs font-bold tracking-widest uppercase text-ink-black/50 mb-1">Transaction</p>
            <h2 id="tx-show-title" className="text-xl font-medium text-ink-black pr-2">
              {t.category || 'Uncategorized'}
            </h2>
            <p className="text-2xl font-medium tabular-nums mt-2">{fmtAmount(t.amount)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full w-10 h-10 text-lg leading-none border border-ink-black/20 hover:bg-ink-black/5"
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>
        <dl className="space-y-4 text-sm">
          <div>
            <dt className="text-xs font-bold tracking-widest uppercase text-ink-black/45 mb-1">Record ID</dt>
            <dd className="font-mono text-xs break-all text-ink-black/90">{t.id}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold tracking-widest uppercase text-ink-black/45 mb-1">Date</dt>
            <dd className="text-ink-black">{t.date}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold tracking-widest uppercase text-ink-black/45 mb-1">Type</dt>
            <dd className="capitalize text-ink-black">{t.type}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold tracking-widest uppercase text-ink-black/45 mb-1">Category</dt>
            <dd className="text-ink-black">{t.category || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold tracking-widest uppercase text-ink-black/45 mb-1">Recurring</dt>
            <dd className="text-ink-black">{t.is_recurring ? 'Yes' : 'No'}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold tracking-widest uppercase text-ink-black/45 mb-1">Last activity</dt>
            <dd className="text-ink-black">{t.last_activity}</dd>
          </div>
        </dl>
        <button type="button" onClick={onClose} className="mt-8 pill-button w-full sm:w-auto">
          Close
        </button>
      </div>
    </div>
  );
}
