import type { TaxResidencyState } from '../types/invoiceExport';
import { defaultTaxResidencyState } from '../types/invoiceExport';
import { isMECountryCode } from '../services/taxResidencyRegistry';
import { getItemMigrated, setItemMigrated } from './localStorageScope';

const STORAGE_KEY = 'ff_tax_calc_residency_v1';

export function loadTaxCalculatorResidency(): TaxResidencyState {
  if (typeof localStorage === 'undefined') {
    return { ...defaultTaxResidencyState };
  }
  try {
    const raw = getItemMigrated(STORAGE_KEY);
    if (!raw) return { ...defaultTaxResidencyState };
    const t = JSON.parse(raw) as Record<string, unknown>;
    const code = t.countryCode;
    const ad = t.additionalData;
    return {
      countryCode:
        typeof code !== 'string' || code === ''
          ? null
          : isMECountryCode(code)
            ? code
            : null,
      additionalData:
        ad && typeof ad === 'object' && !Array.isArray(ad)
          ? (Object.fromEntries(
              Object.entries(ad as Record<string, unknown>).filter(
                (e): e is [string, string] => typeof e[0] === 'string' && typeof e[1] === 'string'
              )
            ) as Record<string, string>)
          : {},
    };
  } catch {
    return { ...defaultTaxResidencyState };
  }
}

export function saveTaxCalculatorResidency(tr: TaxResidencyState) {
  setItemMigrated(STORAGE_KEY, JSON.stringify(tr));
}
