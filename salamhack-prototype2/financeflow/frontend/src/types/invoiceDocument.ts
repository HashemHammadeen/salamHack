/** Rich invoice content (line items, parties, notes). Editable in the invoice plugin. */

export type PartyDetails = {
  legalName: string;
  address: string;
  taxId: string;
  email: string;
  phone: string;
};

export type LineUnitLabel = 'hours' | 'units' | 'days';

export type InvoiceLineItem = {
  id: string;
  description: string;
  quantity: number;
  unitLabel: LineUnitLabel;
  unitPrice: number;
};

export type InvoiceDocumentData = {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  supplier: PartyDetails;
  customer: PartyDetails;
  lineItems: InvoiceLineItem[];
  notes: string;
};

let idCounter = 0;
function newLineId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `line-${Date.now()}-${(idCounter += 1)}`;
}

export function defaultParty(): PartyDetails {
  return {
    legalName: '',
    address: '',
    taxId: '',
    email: '',
    phone: '',
  };
}

export function createLineItem(over: Partial<InvoiceLineItem> = {}): InvoiceLineItem {
  return {
    id: newLineId(),
    description: '',
    quantity: 1,
    unitLabel: 'hours',
    unitPrice: 0,
    ...over,
  };
}

export function defaultInvoiceDocument(): InvoiceDocumentData {
  const today = new Date();
  const due = new Date(today);
  due.setDate(due.getDate() + 30);
  return {
    invoiceNumber: '',
    issueDate: today.toISOString().slice(0, 10),
    dueDate: due.toISOString().slice(0, 10),
    supplier: defaultParty(),
    customer: defaultParty(),
    lineItems: [createLineItem()],
    notes: '',
  };
}

export function lineAmount(item: InvoiceLineItem): number {
  const q = Number.isFinite(item.quantity) ? item.quantity : 0;
  const p = Number.isFinite(item.unitPrice) ? item.unitPrice : 0;
  return q * p;
}

export function documentSubtotal(d: InvoiceDocumentData): number {
  return d.lineItems.reduce((s, l) => s + lineAmount(l), 0);
}
