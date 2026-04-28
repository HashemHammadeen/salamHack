import { documentSubtotal, type InvoiceDocumentData } from '../types/invoiceDocument';
import type { InvoiceOutputFormat } from '../types/invoiceExport';
import { getItemMigrated, setItemMigrated } from './localStorageScope';

function asOutputFormat(v: unknown): InvoiceOutputFormat {
  if (v === 'pdf' || v === 'xlsx' || v === 'docx') return v;
  return 'pdf';
}

const STORAGE_KEY = 'ff_invoice_history_v1';

/** Line items + parties stored at download time for the “Show” panel. */
export type InvoiceHistoryDetail = {
  customerLegalName: string;
  supplierLegalName: string;
  lineItems: {
    description: string;
    quantity: number;
    unitLabel: string;
    unitPrice: number;
  }[];
  notes: string;
};

export type InvoiceHistoryEntry = {
  id: string;
  clientId: string;
  clientName: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  outputFormat: InvoiceOutputFormat;
  createdAt: string;
  /** Optional user-editable label for demos / presentation. */
  presentationTitle?: string;
  /** Snapshot of document at export (for full “Show” dialog). */
  detail?: InvoiceHistoryDetail;
};

export function buildHistoryDetail(doc: InvoiceDocumentData): InvoiceHistoryDetail {
  return {
    customerLegalName: doc.customer.legalName,
    supplierLegalName: doc.supplier.legalName,
    lineItems: doc.lineItems.map((l) => ({
      description: l.description,
      quantity: l.quantity,
      unitLabel: l.unitLabel,
      unitPrice: l.unitPrice,
    })),
    notes: doc.notes,
  };
}

function parseList(raw: string | null): InvoiceHistoryEntry[] {
  if (!raw) return [];
  try {
    const a = JSON.parse(raw) as unknown;
    if (!Array.isArray(a)) return [];
    return a
      .filter(
        (e): e is Record<string, unknown> =>
          e != null && typeof e === 'object' && !Array.isArray(e)
      )
      .map((e) => {
        const detailRaw = e.detail;
        let detail: InvoiceHistoryDetail | undefined;
        if (detailRaw && typeof detailRaw === 'object' && !Array.isArray(detailRaw)) {
          const d = detailRaw as Record<string, unknown>;
          const lines = d.lineItems;
          detail = {
            customerLegalName: String(d.customerLegalName ?? ''),
            supplierLegalName: String(d.supplierLegalName ?? ''),
            lineItems: Array.isArray(lines)
              ? (lines as Record<string, unknown>[]).map((li) => ({
                  description: String(li?.description ?? ''),
                  quantity: typeof li?.quantity === 'number' ? li.quantity : Number(li?.quantity) || 0,
                  unitLabel: String(li?.unitLabel ?? 'hours'),
                  unitPrice: typeof li?.unitPrice === 'number' ? li.unitPrice : Number(li?.unitPrice) || 0,
                }))
              : [],
            notes: String(d.notes ?? ''),
          };
        }
        return {
          id: String(e.id ?? ''),
          clientId: String(e.clientId ?? ''),
          clientName: String(e.clientName ?? ''),
          invoiceNumber: String(e.invoiceNumber ?? ''),
          issueDate: String(e.issueDate ?? ''),
          dueDate: String(e.dueDate ?? ''),
          amount: typeof e.amount === 'number' ? e.amount : Number(e.amount) || 0,
          outputFormat: asOutputFormat(e.outputFormat),
          createdAt: String(e.createdAt ?? ''),
          presentationTitle:
            typeof e.presentationTitle === 'string' ? e.presentationTitle : undefined,
          detail,
        };
      })
      .filter((e) => e.id);
  } catch {
    return [];
  }
}

export function loadInvoiceHistory(): InvoiceHistoryEntry[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    return parseList(getItemMigrated(STORAGE_KEY)).sort(
      (a, b) => (b.createdAt > a.createdAt ? 1 : b.createdAt < a.createdAt ? -1 : 0)
    );
  } catch {
    return [];
  }
}

export function updateInvoiceHistoryEntry(
  id: string,
  patch: Partial<Pick<InvoiceHistoryEntry, 'presentationTitle'>>
): void {
  if (typeof localStorage === 'undefined') return;
  const list = parseList(getItemMigrated(STORAGE_KEY));
  const i = list.findIndex((e) => e.id === id);
  if (i < 0) return;
  list[i] = { ...list[i], ...patch };
  try {
    setItemMigrated(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('updateInvoiceHistoryEntry', e);
  }
}

export function appendInvoiceHistory(
  entry: Omit<InvoiceHistoryEntry, 'id' | 'createdAt'> & { id?: string }
): InvoiceHistoryEntry {
  if (typeof localStorage === 'undefined') {
    return {
      id: entry.id && entry.id.length > 0 ? entry.id : `h-${Date.now()}`,
      clientId: entry.clientId,
      clientName: entry.clientName,
      invoiceNumber: entry.invoiceNumber,
      issueDate: entry.issueDate,
      dueDate: entry.dueDate,
      amount: entry.amount,
      outputFormat: entry.outputFormat,
      createdAt: new Date().toISOString(),
      presentationTitle: entry.presentationTitle,
      detail: entry.detail,
    };
  }
  const list = parseList(getItemMigrated(STORAGE_KEY));
  const row: InvoiceHistoryEntry = {
    id: entry.id && entry.id.length > 0 ? entry.id : `inv-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    clientId: entry.clientId,
    clientName: entry.clientName,
    invoiceNumber: entry.invoiceNumber,
    issueDate: entry.issueDate,
    dueDate: entry.dueDate,
    amount: entry.amount,
    outputFormat: entry.outputFormat,
    createdAt: new Date().toISOString(),
    presentationTitle: entry.presentationTitle,
    detail: entry.detail,
  };
  list.unshift(row);
  const trimmed = list.slice(0, 200);
  try {
    setItemMigrated(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.error('appendInvoiceHistory', e);
  }
  return row;
}

/** Build amount from line items, else fall back. */
export function amountForHistory(doc: InvoiceDocumentData, clientTotal: number): number {
  const sub = documentSubtotal(doc);
  if (sub > 0) return sub;
  return clientTotal;
}
