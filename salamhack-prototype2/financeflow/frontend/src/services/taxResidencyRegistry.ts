/**
 * Single entry point for tax-residency config (Strategy / registry).
 * UI must import only this module — never the raw config for field iteration.
 * Adding a new country: extend ME_TAX_RESIDENCY_BY_COUNTRY in config, then export
 * is handled automatically via getCountryConfig / getFieldsForCountry.
 */

import {
  ME_COUNTRY_CODES,
  ME_TAX_RESIDENCY_BY_COUNTRY,
  type CountryTaxResidencyConfig,
  type MECountryCode,
  type TaxAdditionalFieldDefinition,
} from '../config/meTaxResidency.config';

export function isMECountryCode(code: string | null | undefined): code is MECountryCode {
  if (!code) return false;
  return (ME_COUNTRY_CODES as readonly string[]).includes(code);
}

export function getCountryConfig(code: string | null | undefined): CountryTaxResidencyConfig | null {
  if (!isMECountryCode(code)) return null;
  return ME_TAX_RESIDENCY_BY_COUNTRY[code] ?? null;
}

export function getFieldsForCountry(code: string | null | undefined): TaxAdditionalFieldDefinition[] {
  return getCountryConfig(code)?.additionalFields ?? [];
}

export function listMECountriesForSearch(): { code: MECountryCode; name: string }[] {
  return ME_COUNTRY_CODES.map((code) => ({
    code,
    name: ME_TAX_RESIDENCY_BY_COUNTRY[code].name,
  })).sort((a, b) => a.name.localeCompare(b.name));
}

export function validateTaxResidencyData(
  countryCode: string | null,
  values: Record<string, string>
): { ok: true } | { ok: false; message: string; fieldId?: string } {
  if (!countryCode) {
    return { ok: true };
  }
  if (!isMECountryCode(countryCode)) {
    return { ok: false, message: 'Invalid country' };
  }
  const fields = getFieldsForCountry(countryCode);
  for (const f of fields) {
    if (!f.required) continue;
    const v = (values[f.id] ?? '').trim();
    if (!v) {
      return { ok: false, message: `Required: ${f.label}`, fieldId: f.id };
    }
  }
  return { ok: true };
}
