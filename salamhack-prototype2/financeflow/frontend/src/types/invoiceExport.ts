import type { MECountryCode } from '../config/meTaxResidency.config';
import { defaultInvoiceDocument, type InvoiceDocumentData } from './invoiceDocument';

export type InvoiceOutputFormat = 'pdf' | 'xlsx' | 'docx';

export type InvoiceFontFamily = 'Helvetica' | 'Times-Roman' | 'Courier';

export type TaxResidencyState = {
  countryCode: MECountryCode | null;
  /** Keyed by field `id` from the country registry */
  additionalData: Record<string, string>;
};

/** Default for tax calculator storage (not stored on invoice export). */
export const defaultTaxResidencyState: TaxResidencyState = {
  countryCode: null,
  additionalData: {},
};

export type InvoiceExportConfig = {
  outputFormat: InvoiceOutputFormat;
  /** HTTPS image URL (server fetches when generating). */
  logoUrl: string;
  /** Optional data URL from a local file; saved in this browser. Takes priority over logoUrl when set. */
  logoDataUrl: string;
  fontFamily: InvoiceFontFamily;
  fontSize: number;
  primaryColor: string;
  secondaryColor: string;
  /** Invoice header, line items, parties, notes (sent to the generator as JSON). */
  document: InvoiceDocumentData;
};

export const defaultInvoiceExportConfig: InvoiceExportConfig = {
  outputFormat: 'pdf',
  logoUrl: '',
  logoDataUrl: '',
  fontFamily: 'Helvetica',
  fontSize: 12,
  primaryColor: '#141413',
  secondaryColor: '#CF4500',
  document: defaultInvoiceDocument(),
};

export function toInvoiceApiBody(c: InvoiceExportConfig) {
  const d = c.document;
  const hasLocalLogo = c.logoDataUrl.trim().length > 0;
  return {
    output_format: c.outputFormat,
    logo_data_url: hasLocalLogo ? c.logoDataUrl.trim() : null,
    logo_url: hasLocalLogo ? null : c.logoUrl.trim() || null,
    font_family: c.fontFamily,
    font_size: c.fontSize,
    primary_color: c.primaryColor,
    secondary_color: c.secondaryColor,
    tax_residency: null,
    invoice_document: {
      invoice_number: d.invoiceNumber.trim() || null,
      issue_date: d.issueDate.trim() || null,
      due_date: d.dueDate.trim() || null,
      supplier: {
        legal_name: d.supplier.legalName,
        address: d.supplier.address,
        tax_id: d.supplier.taxId,
        email: d.supplier.email,
        phone: d.supplier.phone,
      },
      customer: {
        legal_name: d.customer.legalName,
        address: d.customer.address,
        tax_id: d.customer.taxId,
        email: d.customer.email,
        phone: d.customer.phone,
      },
      line_items: d.lineItems.map((l) => ({
        id: l.id,
        description: l.description,
        quantity: l.quantity,
        unit_label: l.unitLabel,
        unit_price: l.unitPrice,
      })),
      notes: d.notes,
    },
  };
}
