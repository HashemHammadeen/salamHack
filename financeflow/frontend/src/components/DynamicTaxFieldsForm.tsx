import { getFieldsForCountry } from '../services/taxResidencyRegistry';
import type { MECountryCode } from '../config/meTaxResidency.config';

type DynamicTaxFieldsFormProps = {
  /** Re-render key; parent should reset `values` when this changes */
  countryCode: MECountryCode | null;
  values: Record<string, string>;
  onChange: (fieldId: string, value: string) => void;
  idPrefix: string;
  /** For validation / aria */
  errorFieldId?: string;
};

/**
 * Renders required/optional tax fields from the registry for the current country.
 * When `countryCode` changes, the parent must clear `values` — this component
 * does not keep internal copies of other countries’ data.
 */
export default function DynamicTaxFieldsForm({
  countryCode,
  values,
  onChange,
  idPrefix,
  errorFieldId,
}: DynamicTaxFieldsFormProps) {
  const fields = getFieldsForCountry(countryCode);

  if (fields.length === 0) {
    return (
      <p className="text-sm text-ink-black/50">
        {countryCode
          ? 'No additional tax identifiers are configured for this country.'
          : 'Select a country to see any required tax and residency details.'}
      </p>
    );
  }

  return (
    <div className="space-y-4" key={countryCode ?? 'none'}>
      {fields.map((f) => {
        const inputId = `${idPrefix}-tax-${f.id}`;
        const hasErr = errorFieldId === f.id;
        return (
          <div key={f.id}>
            <label htmlFor={inputId} className="text-sm font-medium text-ink-black/80 block mb-1.5">
              {f.label}
              {f.required ? <span className="text-signal-orange"> *</span> : null}
            </label>
            {f.helperText && (
              <p className="text-xs text-ink-black/50 mb-1.5 max-w-lg">{f.helperText}</p>
            )}
            <input
              id={inputId}
              name={f.id}
              type={f.type}
              value={values[f.id] ?? ''}
              onChange={(e) => onChange(f.id, e.target.value)}
              placeholder={f.placeholder}
              maxLength={f.maxLength}
              autoComplete={f.autoComplete}
              aria-invalid={hasErr}
              className={[
                'w-full max-w-xl bg-white/80 border-b-2 px-0 py-2 outline-none transition-colors',
                hasErr ? 'border-signal-orange' : 'border-ink-black/20 focus:border-ink-black',
              ].join(' ')}
            />
          </div>
        );
      })}
    </div>
  );
}
