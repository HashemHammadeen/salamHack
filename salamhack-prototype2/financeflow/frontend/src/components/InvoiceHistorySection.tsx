import { useCallback, useEffect, useState } from 'react';
import { Eye, Pencil } from 'lucide-react';
import {
  loadInvoiceHistory,
  updateInvoiceHistoryEntry,
  type InvoiceHistoryEntry,
  type InvoiceHistoryDetail,
} from '../lib/invoiceHistoryStorage';

function fmtTime(iso: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function defaultTitle(r: InvoiceHistoryEntry) {
  if (r.presentationTitle?.trim()) return r.presentationTitle.trim();
  return r.invoiceNumber || r.clientName || 'Invoice';
}

function LineItemsTable({ detail }: { detail: InvoiceHistoryDetail | undefined }) {
  if (!detail?.lineItems?.length) {
    return <p className="text-sm text-ink-black/50">No line items were stored for this entry.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-ink-black/10">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="bg-ink-black/[0.03] text-ink-black/50 border-b border-ink-black/10">
            <th className="py-2 px-3 font-bold tracking-tight">Description</th>
            <th className="py-2 px-3">Qty</th>
            <th className="py-2 px-3">Unit</th>
            <th className="py-2 px-3 text-right">Price</th>
            <th className="py-2 px-3 text-right">Line</th>
          </tr>
        </thead>
        <tbody>
          {detail.lineItems.map((li, i) => {
            const line = li.quantity * li.unitPrice;
            return (
              <tr key={i} className="border-b border-ink-black/5 last:border-0">
                <td className="py-2.5 px-3">{li.description || '—'}</td>
                <td className="py-2.5 px-3 tabular-nums">{li.quantity}</td>
                <td className="py-2.5 px-3 text-ink-black/70">{li.unitLabel}</td>
                <td className="py-2.5 px-3 text-right tabular-nums">
                  ${li.unitPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </td>
                <td className="py-2.5 px-3 text-right font-medium tabular-nums">
                  ${line.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

type ShowModalProps = {
  entry: InvoiceHistoryEntry;
  onClose: () => void;
  onUpdated: () => void;
};

function InvoiceHistoryShowModal({ entry, onClose, onUpdated }: ShowModalProps) {
  const [titleDraft, setTitleDraft] = useState(
    () => entry.presentationTitle?.trim() || defaultTitle(entry)
  );
  const [saving, setSaving] = useState(false);
  const d = entry.detail;

  useEffect(() => {
    setTitleDraft(entry.presentationTitle?.trim() || defaultTitle(entry));
  }, [entry.id, entry.presentationTitle, entry.invoiceNumber, entry.clientName]);

  const saveTitle = useCallback(() => {
    const next = titleDraft.trim();
    setSaving(true);
    try {
      updateInvoiceHistoryEntry(entry.id, {
        presentationTitle: next || undefined,
      });
      onUpdated();
    } finally {
      setSaving(false);
    }
  }, [entry.id, titleDraft, onUpdated]);

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
        aria-labelledby="inv-hist-title"
        className="relative w-full sm:max-w-2xl max-h-[min(90vh,900px)] overflow-y-auto bg-canvas-cream sm:rounded-3xl shadow-2xl border border-ink-black/10 p-6 sm:p-8 outline-none"
      >
        <div className="flex justify-between items-start gap-3 mb-6">
          <div>
            <p className="text-xs font-bold tracking-widest uppercase text-ink-black/50 mb-1">Invoice snapshot</p>
            <h2 id="inv-hist-title" className="text-xl font-medium text-ink-black pr-2">
              {defaultTitle(entry)}
            </h2>
            <p className="text-sm text-ink-black/60 mt-1">
              {fmtTime(entry.createdAt)} · {entry.outputFormat.toUpperCase()}
            </p>
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

        <div className="space-y-6">
          <div className="rounded-2xl border border-ink-black/10 p-4 bg-white/50">
            <p className="text-xs font-bold tracking-widest uppercase text-ink-black/45 mb-2">Presentation label</p>
            <p className="text-xs text-ink-black/50 mb-3">
              Use this for demos: it appears in the list and in this header after you save.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                className="flex-1 rounded-xl border border-ink-black/20 px-3 py-2 text-sm"
                placeholder="e.g. Q1 — Acme retainer"
              />
              <button
                type="button"
                onClick={saveTitle}
                disabled={saving}
                className="pill-button inline-flex items-center justify-center gap-1.5 shrink-0"
              >
                <Pencil size={14} />
                Save label
              </button>
            </div>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-xs font-bold tracking-widest uppercase text-ink-black/45 mb-1">Invoice #</dt>
              <dd className="font-mono">{entry.invoiceNumber}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold tracking-widest uppercase text-ink-black/45 mb-1">Client</dt>
              <dd>{entry.clientName}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold tracking-widest uppercase text-ink-black/45 mb-1">Issue → Due</dt>
              <dd>
                {entry.issueDate} → {entry.dueDate}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-bold tracking-widest uppercase text-ink-black/45 mb-1">Amount</dt>
              <dd className="text-lg font-medium tabular-nums">
                ${entry.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </dd>
            </div>
          </dl>

          {d && (
            <>
              <div>
                <h3 className="text-xs font-bold tracking-widest uppercase text-ink-black/50 mb-2">Parties</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl border border-ink-black/10 p-3">
                    <p className="text-xs text-ink-black/50 mb-1">Customer (bill to)</p>
                    <p className="font-medium">{d.customerLegalName || '—'}</p>
                  </div>
                  <div className="rounded-xl border border-ink-black/10 p-3">
                    <p className="text-xs text-ink-black/50 mb-1">Supplier (from)</p>
                    <p className="font-medium">{d.supplierLegalName || '—'}</p>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-xs font-bold tracking-widest uppercase text-ink-black/50 mb-2">Line items</h3>
                <LineItemsTable detail={d} />
              </div>
              {d.notes?.trim() ? (
                <div>
                  <h3 className="text-xs font-bold tracking-widest uppercase text-ink-black/50 mb-2">Notes</h3>
                  <p className="text-sm whitespace-pre-wrap rounded-xl border border-ink-black/10 p-3 bg-ink-black/[0.02]">
                    {d.notes}
                  </p>
                </div>
              ) : null}
            </>
          )}
        </div>

        <button type="button" onClick={onClose} className="mt-8 pill-button w-full sm:w-auto">
          Close
        </button>
      </div>
    </div>
  );
}

export default function InvoiceHistorySection() {
  const [rows, setRows] = useState<InvoiceHistoryEntry[]>(() => loadInvoiceHistory());
  const [showId, setShowId] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setRows(loadInvoiceHistory());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible') {
        refresh();
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [refresh]);

  const showEntry = showId ? rows.find((r) => r.id === showId) : null;

  if (rows.length === 0) {
    return (
      <div className="card p-6 md:p-8">
        <h2 className="text-sm font-bold tracking-widest uppercase text-ink-black/50 mb-2">Invoice history</h2>
        <p className="text-ink-black/60 text-sm max-w-2xl">
          Generated files are listed here (saved in this browser) after you download an invoice from the clients page.
          Open this page after a download to see new entries.
        </p>
      </div>
    );
  }

  return (
    <div className="card p-6 md:p-8 overflow-x-auto">
      <h2 className="text-sm font-bold tracking-widest uppercase text-ink-black/50 mb-2">Invoice history</h2>
      <p className="text-ink-black/50 text-xs mb-4 max-w-2xl">
        Recent exports from this device, newest first. Last 200 kept. Use <strong>Show</strong> to open a full snapshot
        for presentations and to edit the display label.
      </p>
      <table className="w-full min-w-[720px] text-sm border-collapse">
        <thead>
          <tr className="text-left text-ink-black/50 border-b border-ink-black/10">
            <th className="py-2 pr-3 font-bold tracking-tight">Issued (local)</th>
            <th className="py-2 pr-3">Label / #</th>
            <th className="py-2 pr-3">Client</th>
            <th className="py-2 pr-3">Issue → Due</th>
            <th className="py-2 pr-3">Amount</th>
            <th className="py-2 pr-3">Format</th>
            <th className="py-2 pr-0 w-[88px] text-right">Show</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-ink-black/5 last:border-0">
              <td className="py-2.5 pr-3 text-ink-black/70 whitespace-nowrap tabular-nums text-xs align-top">
                {fmtTime(r.createdAt)}
              </td>
              <td className="py-2.5 pr-3 align-top">
                <div className="font-mono text-xs text-ink-black">{r.invoiceNumber}</div>
                {r.presentationTitle?.trim() && (
                  <div className="text-xs text-ink-black/60 mt-0.5 line-clamp-2">{r.presentationTitle}</div>
                )}
              </td>
              <td className="py-2.5 pr-3 align-top">{r.clientName}</td>
              <td className="py-2.5 pr-3 text-ink-black/80 text-xs align-top">
                {r.issueDate} → {r.dueDate}
              </td>
              <td className="py-2.5 pr-3 tabular-nums font-medium align-top">
                ${r.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </td>
              <td className="py-2.5 pr-3 font-mono text-xs uppercase align-top">{r.outputFormat}</td>
              <td className="py-2.5 pl-2 pr-0 text-right align-top">
                <button
                  type="button"
                  onClick={() => setShowId(r.id)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-full border border-ink-black/20 px-3 py-1.5 text-xs font-medium hover:bg-ink-black hover:text-canvas-cream transition-colors"
                >
                  <Eye size={14} />
                  Show
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showEntry && (
        <InvoiceHistoryShowModal
          key={showEntry.id}
          entry={showEntry}
          onClose={() => setShowId(null)}
          onUpdated={refresh}
        />
      )}
    </div>
  );
}
