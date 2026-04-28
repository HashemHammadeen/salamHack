import { peekNextInvoiceNumber } from '../lib/invoiceNumber';
import type { InvoiceDocumentData, InvoiceLineItem, LineUnitLabel, PartyDetails } from '../types/invoiceDocument';
import { createLineItem, documentSubtotal, lineAmount } from '../types/invoiceDocument';

const unitOptions: { id: LineUnitLabel; label: string }[] = [
  { id: 'hours', label: 'Hours' },
  { id: 'units', label: 'Units' },
  { id: 'days', label: 'Days' },
];

type InvoiceDocumentFormProps = {
  idPrefix: string;
  value: InvoiceDocumentData;
  onChange: (next: InvoiceDocumentData) => void;
  /** Smaller padding for modal */
  compact?: boolean;
};

function PartyBlock({
  title,
  idPrefix,
  party,
  onPartyChange,
}: {
  title: string;
  idPrefix: string;
  party: PartyDetails;
  onPartyChange: (p: PartyDetails) => void;
}) {
  const field = (key: keyof PartyDetails, label: string, type: 'text' | 'email' | 'tel' = 'text', multiline?: boolean) => (
    <div key={key} className="sm:col-span-2">
      <label
        htmlFor={`${idPrefix}-${key}`}
        className="text-xs font-bold tracking-widest uppercase text-ink-black/45 block mb-1.5"
      >
        {label}
      </label>
      {multiline ? (
        <textarea
          id={`${idPrefix}-${key}`}
          value={party[key]}
          onChange={(e) => onPartyChange({ ...party, [key]: e.target.value })}
          rows={3}
          className="w-full bg-white/80 border-2 border-ink-black/15 rounded-2xl px-4 py-3 text-sm outline-none focus:border-ink-black resize-y min-h-[72px]"
        />
      ) : (
        <input
          id={`${idPrefix}-${key}`}
          type={type}
          value={party[key]}
          onChange={(e) => onPartyChange({ ...party, [key]: e.target.value })}
          className="w-full bg-white/80 border-2 border-ink-black/15 rounded-2xl px-4 py-2.5 text-sm outline-none focus:border-ink-black"
        />
      )}
    </div>
  );

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-bold tracking-widest uppercase text-ink-black/50">{title}</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {field('legalName', 'Legal name')}
        {field('address', 'Address', 'text', true)}
        {field('taxId', 'Tax ID (VAT / GST / SSN)')}
        {field('email', 'Email', 'email')}
        {field('phone', 'Phone / contact', 'tel')}
      </div>
    </div>
  );
}

export default function InvoiceDocumentForm({ idPrefix, value, onChange, compact }: InvoiceDocumentFormProps) {
  const sub = documentSubtotal(value);

  const setDoc = (patch: Partial<InvoiceDocumentData>) => onChange({ ...value, ...patch });
  const setLine = (index: number, line: InvoiceLineItem) => {
    const lineItems = value.lineItems.map((l, i) => (i === index ? line : l));
    setDoc({ lineItems });
  };
  const addLine = () => setDoc({ lineItems: [...value.lineItems, createLineItem()] });
  const removeLine = (index: number) => {
    if (value.lineItems.length <= 1) return;
    setDoc({ lineItems: value.lineItems.filter((_, i) => i !== index) });
  };

  return (
    <div className={compact ? 'space-y-5' : 'space-y-7'}>
      <div>
        <h3 className="text-sm font-bold tracking-widest uppercase text-ink-black/50 mb-2">Invoice data</h3>
        <p className="text-xs text-ink-black/50 max-w-2xl mb-4">
          Invoice number, dates, line items, and party details are included in generated PDF, Excel, and Word
          files.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
          <div>
            <label
              htmlFor={`${idPrefix}-inv-no`}
              className="text-xs font-bold tracking-widest uppercase text-ink-black/45 block mb-1.5"
            >
              Invoice number
            </label>
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <input
                id={`${idPrefix}-inv-no`}
                type="text"
                value={value.invoiceNumber}
                onChange={(e) => setDoc({ invoiceNumber: e.target.value })}
                placeholder="INV-2026-001"
                className="flex-1 min-w-0 bg-white/80 border-2 border-ink-black/15 rounded-2xl px-4 py-2.5 text-sm outline-none focus:border-ink-black font-mono"
              />
              <button
                type="button"
                onClick={() =>
                  setDoc({
                    invoiceNumber: peekNextInvoiceNumber(),
                  })
                }
                className="shrink-0 text-sm font-medium text-ink-black/80 px-3 py-2 rounded-2xl border border-ink-black/20 hover:bg-ink-black/5"
              >
                Use next
              </button>
            </div>
            <p className="text-xs text-ink-black/40 mt-1.5">Sequential id (e.g. INV-2026-001). Use next assigns from your saved counter in this browser.</p>
          </div>
          <div>
            <label
              htmlFor={`${idPrefix}-issue`}
              className="text-xs font-bold tracking-widest uppercase text-ink-black/45 block mb-1.5"
            >
              Issue date
            </label>
            <input
              id={`${idPrefix}-issue`}
              type="date"
              value={value.issueDate}
              onChange={(e) => {
                const issueDate = e.target.value;
                if (!issueDate) {
                  setDoc({ issueDate });
                  return;
                }
                const due = new Date(`${issueDate}T12:00:00`);
                if (Number.isNaN(due.getTime())) {
                  setDoc({ issueDate });
                  return;
                }
                due.setDate(due.getDate() + 30);
                setDoc({ issueDate, dueDate: due.toISOString().slice(0, 10) });
              }}
              className="w-full bg-white/80 border-2 border-ink-black/15 rounded-2xl px-3 py-2.5 text-sm outline-none focus:border-ink-black"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-ink-black/10 pt-5 space-y-6">
        <PartyBlock
          title="Customer (bill to)"
          idPrefix={`${idPrefix}-cust`}
          party={value.customer}
          onPartyChange={(customer) => setDoc({ customer })}
        />
        <PartyBlock
          title="Supplier (your business)"
          idPrefix={`${idPrefix}-supp`}
          party={value.supplier}
          onPartyChange={(supplier) => setDoc({ supplier })}
        />
      </div>

      <div>
        <h4 className="text-xs font-bold tracking-widest uppercase text-ink-black/50 mb-3">Line items</h4>
        <div className="space-y-3">
          {value.lineItems.map((line, i) => (
            <div
              key={line.id}
              className="p-3 sm:p-4 rounded-2xl border border-ink-black/10 bg-white/50 space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-ink-black/40">Item {i + 1}</span>
                {value.lineItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLine(i)}
                    className="text-xs text-signal-orange hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div>
                <label
                  className="text-xs text-ink-black/50 block mb-1"
                  htmlFor={`${idPrefix}-desc-${i}`}
                >
                  Description
                </label>
                <input
                  id={`${idPrefix}-desc-${i}`}
                  type="text"
                  value={line.description}
                  onChange={(e) => setLine(i, { ...line, description: e.target.value })}
                  placeholder="e.g. Professional services"
                  className="w-full bg-white/80 border-b-2 border-ink-black/20 py-2 outline-none focus:border-ink-black"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs text-ink-black/50 block mb-1" htmlFor={`${idPrefix}-qty-${i}`}>
                    Quantity
                  </label>
                  <input
                    id={`${idPrefix}-qty-${i}`}
                    type="number"
                    min={0}
                    step="0.25"
                    value={line.quantity}
                    onChange={(e) =>
                      setLine(i, { ...line, quantity: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full bg-white/80 border-2 border-ink-black/15 rounded-2xl px-3 py-2 text-sm tabular-nums"
                  />
                </div>
                <div>
                  <label className="text-xs text-ink-black/50 block mb-1" htmlFor={`${idPrefix}-ul-${i}`}>
                    Qty / unit
                  </label>
                  <select
                    id={`${idPrefix}-ul-${i}`}
                    value={line.unitLabel}
                    onChange={(e) => setLine(i, { ...line, unitLabel: e.target.value as LineUnitLabel })}
                    className="w-full bg-white/80 border-2 border-ink-black/15 rounded-2xl px-3 py-2 text-sm"
                  >
                    {unitOptions.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-ink-black/50 block mb-1" htmlFor={`${idPrefix}-up-${i}`}>
                    Unit price / rate
                  </label>
                  <input
                    id={`${idPrefix}-up-${i}`}
                    type="number"
                    min={0}
                    step="0.01"
                    value={line.unitPrice}
                    onChange={(e) =>
                      setLine(i, { ...line, unitPrice: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full bg-white/80 border-2 border-ink-black/15 rounded-2xl px-3 py-2 text-sm tabular-nums"
                  />
                </div>
                <div>
                  <span className="text-xs text-ink-black/50 block mb-1">Line total</span>
                  <p className="pt-2 text-sm font-medium tabular-nums">${lineAmount(line).toFixed(2)}</p>
                </div>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addLine}
            className="text-sm font-medium text-ink-black/80 underline underline-offset-2"
          >
            + Add line item
          </button>
        </div>
        <p className="text-sm font-medium mt-3 tabular-nums">
          Subtotal: <span className="text-ink-black">${sub.toFixed(2)}</span>
        </p>
      </div>

      <div>
        <label
          htmlFor={`${idPrefix}-notes`}
          className="text-xs font-bold tracking-widest uppercase text-ink-black/50 block mb-2"
        >
          Personalized notes
        </label>
        <textarea
          id={`${idPrefix}-notes`}
          value={value.notes}
          onChange={(e) => setDoc({ notes: e.target.value })}
          rows={compact ? 3 : 4}
          placeholder="Payment terms, bank details, thank-you message…"
          className="w-full max-w-2xl bg-white/80 border-2 border-ink-black/15 rounded-2xl px-4 py-3 text-sm outline-none focus:border-ink-black resize-y"
        />
      </div>
    </div>
  );
}
