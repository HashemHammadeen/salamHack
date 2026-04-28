import { getItemMigrated, setItemMigrated } from './localStorageScope';

const STORAGE_KEY = 'ff_invoice_seq_v1';

/** Format INV-YYYY-NNN using the current sequence in storage. */
export function formatInvoiceNumberForYear(year: number): string {
  if (typeof localStorage === 'undefined') {
    return `INV-${year}-001`;
  }
  try {
    const n = Math.max(0, parseInt(getItemMigrated(STORAGE_KEY) || '0', 10) || 0) + 1;
    return `INV-${year}-${String(n).padStart(3, '0')}`;
  } catch {
    return `INV-${year}-001`;
  }
}

/** Bumps the sequence after a successful download (or manual issue). */
export function bumpInvoiceSequence(): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const cur = Math.max(0, parseInt(getItemMigrated(STORAGE_KEY) || '0', 10) || 0);
    setItemMigrated(STORAGE_KEY, String(cur + 1));
  } catch (e) {
    console.error('bumpInvoiceSequence', e);
  }
}

/** Preview next number string without mutating. */
export function peekNextInvoiceNumber(): string {
  const y = new Date().getFullYear();
  if (typeof localStorage === 'undefined') {
    return `INV-${y}-001`;
  }
  try {
    const n = Math.max(0, parseInt(getItemMigrated(STORAGE_KEY) || '0', 10) || 0) + 1;
    return `INV-${y}-${String(n).padStart(3, '0')}`;
  } catch {
    return `INV-${y}-001`;
  }
}
