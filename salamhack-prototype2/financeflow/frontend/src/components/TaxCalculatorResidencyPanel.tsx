import { useCallback, useEffect, useId, useState } from 'react';
import type { TaxResidencyState } from '../types/invoiceExport';
import { loadTaxCalculatorResidency, saveTaxCalculatorResidency } from '../lib/taxCalculatorResidencyStorage';
import TaxResidencySection from './TaxResidencySection';
import { validateTaxResidencyData } from '../services/taxResidencyRegistry';

/**
 * Tax Residency & Location for the tax calculator module only (separate from invoice export).
 * Data lives in `ff_tax_calc_residency_v1` — new countries: edit `meTaxResidency.config.ts` only.
 */
export default function TaxCalculatorResidencyPanel() {
  const idp = useId();
  const [value, setValue] = useState<TaxResidencyState>(() => loadTaxCalculatorResidency());
  const [savedMsg, setSavedMsg] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldId, setFieldId] = useState<string | undefined>(undefined);

  useEffect(() => {
    setValue(loadTaxCalculatorResidency());
  }, []);

  const onSave = useCallback(() => {
    const v = validateTaxResidencyData(value.countryCode, value.additionalData);
    if (!v.ok) {
      setFormError(v.message);
      setFieldId(v.fieldId);
      return;
    }
    setFormError(null);
    setFieldId(undefined);
    saveTaxCalculatorResidency(value);
    setSavedMsg(true);
    window.setTimeout(() => setSavedMsg(false), 2000);
  }, [value]);

  return (
    <section className="card p-6 md:p-8">
      <h2 className="text-sm font-bold tracking-widest uppercase text-ink-black/50 mb-2">
        Tax residency &amp; location
      </h2>
      <p className="text-ink-black/60 text-sm mb-6 max-w-2xl">
        Used for finance invoicing and compliance context. Country-specific fields are loaded from a central
        registry (Middle East &amp; Cyprus). Adding a new jurisdiction only requires a config entry — not
        new UI code.
      </p>
      <TaxResidencySection
        idPrefix={`${idp}-tcalc`}
        value={value}
        onChange={setValue}
        errorFieldId={fieldId}
        compact
      />
      {formError ? (
        <p className="mt-2 text-sm text-signal-orange" role="alert">
          {formError}
        </p>
      ) : null}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button type="button" onClick={onSave} className="pill-button">
          Save for this device
        </button>
        {savedMsg ? (
          <span className="text-sm text-ink-black/50" role="status">
            Saved
          </span>
        ) : null}
      </div>
    </section>
  );
}
