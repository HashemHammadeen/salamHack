const key = (tenantId: string) => `ff_invoice_seq_v1_${tenantId}`;

/** Format INV-YYYY-NNN using the current sequence in storage. */
export function formatInvoiceNumberForYear(tenantId: string, year: number): string {
  if (typeof localStorage === 'undefined') {
    return `INV-${year}-001`;
  }
  try {
    const n = Math.max(0, parseInt(localStorage.getItem(key(tenantId)) || '0', 10) || 0) + 1;
    return `INV-${year}-${String(n).padStart(3, '0')}`;
  } catch {
    return `INV-${year}-001`;
  }
}

/** Bumps the per-tenant sequence after a successful download (or manual issue). */
export function bumpInvoiceSequence(tenantId: string): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const cur = Math.max(0, parseInt(localStorage.getItem(key(tenantId)) || '0', 10) || 0);
    localStorage.setItem(key(tenantId), String(cur + 1));
  } catch (e) {
    console.error('bumpInvoiceSequence', e);
  }
}

/** Preview next number string without mutating. */
export function peekNextInvoiceNumber(tenantId: string): string {
  const y = new Date().getFullYear();
  if (typeof localStorage === 'undefined') {
    return `INV-${y}-001`;
  }
  try {
    const n = Math.max(0, parseInt(localStorage.getItem(key(tenantId)) || '0', 10) || 0) + 1;
    return `INV-${y}-${String(n).padStart(3, '0')}`;
  } catch {
    return `INV-${y}-001`;
  }
}
