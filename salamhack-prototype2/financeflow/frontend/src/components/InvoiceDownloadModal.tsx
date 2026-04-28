import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useFinanceData } from '../context/FinanceDataContext';
import { defaultInvoiceExportConfig } from '../types/invoiceExport';
import type { InvoiceExportConfig } from '../types/invoiceExport';
import InvoiceExportForm from './InvoiceExportForm';
import { peekNextInvoiceNumber } from '../lib/invoiceNumber';

type InvoiceDownloadModalProps = {
  onClose: () => void;
  clientId: string;
  clientName: string;
};

export default function InvoiceDownloadModal({ onClose, clientId, clientName }: InvoiceDownloadModalProps) {
  const { invoiceExportConfig, setInvoiceExportConfig, downloadInvoice, clients } = useFinanceData();
  const [draft, setDraft] = useState<InvoiceExportConfig>(() => ({ ...invoiceExportConfig }));
  const [saveAsDefault, setSaveAsDefault] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();

  const client = clients.find((x) => x.id === clientId);

  useEffect(() => {
    const base = { ...invoiceExportConfig };
    const doc = { ...base.document, customer: { ...base.document.customer } };
    if (client) {
      if (!doc.customer.legalName.trim()) {
        doc.customer.legalName = client.name ?? '';
        if (client.email) doc.customer.email = String(client.email);
      }
      if (!doc.invoiceNumber.trim()) {
        doc.invoiceNumber = peekNextInvoiceNumber();
      }
      if (doc.lineItems[0] && doc.lineItems[0].unitPrice === 0 && Number(client.total_billed) > 0) {
        doc.lineItems = base.document.lineItems.map((l, i) =>
          i === 0
            ? {
                ...l,
                unitPrice: Number(client.total_billed),
                description: l.description || 'Billed work',
                quantity: l.quantity > 0 ? l.quantity : 1,
              }
            : l
        );
      }
    } else {
      if (!doc.invoiceNumber.trim()) {
        doc.invoiceNumber = peekNextInvoiceNumber();
      }
    }
    setDraft({ ...base, document: doc });
    setSaveAsDefault(false);
  }, [invoiceExportConfig, clientId, client]);

  const patchDraft = useCallback((p: Partial<InvoiceExportConfig>) => {
    setDraft((prev) => ({ ...prev, ...p }));
  }, []);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [handleClose]);

  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const onDownload = async () => {
    if (saveAsDefault) {
      setInvoiceExportConfig(draft);
    }
    try {
      await downloadInvoice(clientId, draft);
      onClose();
    } catch {
      /* Error already surfaced; keep dialog open to fix and retry. */
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-ink-black/40 backdrop-blur-sm border-0 cursor-default w-full h-full"
        onClick={handleClose}
        aria-label="Close dialog"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        tabIndex={-1}
        className="relative w-full sm:max-w-2xl lg:max-w-4xl max-h-[min(92vh,900px)] flex flex-col bg-canvas-cream sm:rounded-3xl shadow-2xl border border-ink-black/10 outline-none"
      >
        <div className="shrink-0 flex items-start justify-between gap-3 px-5 pt-5 pb-2 sm:px-8 sm:pt-8 border-b border-ink-black/10">
          <div>
            <h2 id={titleId} className="text-xl font-medium text-ink-black pr-2">
              Invoice before download
            </h2>
            <p id={descId} className="text-sm text-ink-black/60 mt-1">
              Options below are loaded from your Invoice Generator settings. Tweak them for this file
              only, or check &ldquo;Update saved settings&rdquo; to keep changes.
            </p>
            <p className="text-sm text-ink-black/80 mt-2">
              <span className="text-ink-black/50">Client:</span>{' '}
              <span className="font-medium">{clientName}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="shrink-0 rounded-full w-10 h-10 text-lg leading-none border border-ink-black/20 hover:bg-ink-black/5"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto flex-1 min-h-0 px-5 py-4 sm:px-8 sm:py-6">
          <InvoiceExportForm
            idPrefix="modal-inv"
            value={draft}
            onChange={patchDraft}
            onResetToDefaults={() => setDraft({ ...defaultInvoiceExportConfig })}
            compact
          />
        </div>

        <div className="shrink-0 border-t border-ink-black/10 px-5 py-4 sm:px-8 sm:py-5 bg-lifted-cream/50 sm:rounded-b-3xl">
          <label className="flex items-start gap-3 cursor-pointer text-sm text-ink-black/80 mb-4">
            <input
              type="checkbox"
              className="mt-1 rounded border-ink-black/30"
              checked={saveAsDefault}
              onChange={(e) => setSaveAsDefault(e.target.checked)}
            />
            <span>Update saved invoice settings (plugin page) with these values</span>
          </label>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3">
            <button type="button" onClick={handleClose} className="pill-button-secondary w-full sm:w-auto">
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void onDownload()}
              className="pill-button w-full sm:w-auto"
            >
              Download
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
