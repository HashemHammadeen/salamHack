import type { InvoiceExportConfig } from '../types/invoiceExport';
import { defaultInvoiceExportConfig } from '../types/invoiceExport';
import {
  createLineItem,
  defaultInvoiceDocument,
  defaultParty,
  type InvoiceDocumentData,
  type InvoiceLineItem,
  type LineUnitLabel,
} from '../types/invoiceDocument';
import { getItemMigrated, setItemMigrated } from './localStorageScope';

const STORAGE_KEY = 'ff_invoice_export_v1';

function isFormat(v: string): v is InvoiceExportConfig['outputFormat'] {
  return v === 'pdf' || v === 'xlsx' || v === 'docx';
}

function isFont(v: string): v is InvoiceExportConfig['fontFamily'] {
  return v === 'Helvetica' || v === 'Times-Roman' || v === 'Courier';
}

const UNIT: LineUnitLabel[] = ['hours', 'units', 'days'];

function isUnitLabel(v: string): v is LineUnitLabel {
  return (UNIT as string[]).includes(v);
}

function parseParty(p: unknown): InvoiceDocumentData['supplier'] {
  if (!p || typeof p !== 'object' || Array.isArray(p)) return defaultParty();
  const o = p as Record<string, unknown>;
  return {
    legalName: typeof o.legalName === 'string' ? o.legalName : '',
    address: typeof o.address === 'string' ? o.address : '',
    taxId: typeof o.taxId === 'string' ? o.taxId : '',
    email: typeof o.email === 'string' ? o.email : '',
    phone: typeof o.phone === 'string' ? o.phone : '',
  };
}

function parseLineItem(p: unknown): InvoiceLineItem | null {
  if (!p || typeof p !== 'object' || Array.isArray(p)) return null;
  const o = p as Record<string, unknown>;
  const ul = typeof o.unitLabel === 'string' && isUnitLabel(o.unitLabel) ? o.unitLabel : 'hours';
  const qty = typeof o.quantity === 'number' ? o.quantity : parseFloat(String(o.quantity));
  const up = typeof o.unitPrice === 'number' ? o.unitPrice : parseFloat(String(o.unitPrice));
  return {
    id: typeof o.id === 'string' && o.id ? o.id : createLineItem().id,
    description: typeof o.description === 'string' ? o.description : '',
    quantity: Number.isFinite(qty) ? qty : 1,
    unitLabel: ul,
    unitPrice: Number.isFinite(up) ? up : 0,
  };
}

function parseDocument(raw: unknown): InvoiceDocumentData {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return defaultInvoiceDocument();
  }
  const o = raw as Record<string, unknown>;
  const itemsRaw = o.lineItems;
  let lineItems: InvoiceLineItem[] = Array.isArray(itemsRaw)
    ? (itemsRaw.map(parseLineItem).filter(Boolean) as InvoiceLineItem[])
    : [];
  if (lineItems.length === 0) lineItems = [createLineItem()];
  return {
    invoiceNumber: typeof o.invoiceNumber === 'string' ? o.invoiceNumber : '',
    issueDate: typeof o.issueDate === 'string' ? o.issueDate : defaultInvoiceDocument().issueDate,
    dueDate: typeof o.dueDate === 'string' ? o.dueDate : defaultInvoiceDocument().dueDate,
    supplier: parseParty(o.supplier),
    customer: parseParty(o.customer),
    lineItems,
    notes: typeof o.notes === 'string' ? o.notes : '',
  };
}

export function loadInvoiceExport(): InvoiceExportConfig {
  if (typeof localStorage === 'undefined') {
    return { ...defaultInvoiceExportConfig };
  }
  try {
    const raw = getItemMigrated(STORAGE_KEY);
    if (!raw) return { ...defaultInvoiceExportConfig };
    const o = JSON.parse(raw) as Record<string, unknown>;
    if (!o || typeof o !== 'object') return { ...defaultInvoiceExportConfig };
    const of = o.outputFormat;
    const ff = o.fontFamily;
    const docRaw = o.document;
    return {
      outputFormat: typeof of === 'string' && isFormat(of) ? of : 'pdf',
      logoUrl: typeof o.logoUrl === 'string' ? o.logoUrl : '',
      logoDataUrl: typeof o.logoDataUrl === 'string' ? o.logoDataUrl : '',
      fontFamily: typeof ff === 'string' && isFont(ff) ? ff : 'Helvetica',
      fontSize:
        typeof o.fontSize === 'number' && o.fontSize >= 8 && o.fontSize <= 24
          ? o.fontSize
          : 12,
      primaryColor: typeof o.primaryColor === 'string' ? o.primaryColor : '#141413',
      secondaryColor: typeof o.secondaryColor === 'string' ? o.secondaryColor : '#CF4500',
      document: docRaw !== undefined ? parseDocument(docRaw) : defaultInvoiceDocument(),
    };
  } catch {
    return { ...defaultInvoiceExportConfig };
  }
}

export function saveInvoiceExport(c: InvoiceExportConfig) {
  setItemMigrated(STORAGE_KEY, JSON.stringify(c));
}
