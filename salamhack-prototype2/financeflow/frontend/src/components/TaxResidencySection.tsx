import SearchableCountrySelect from './SearchableCountrySelect';
import DynamicTaxFieldsForm from './DynamicTaxFieldsForm';
import type { TaxResidencyState } from '../types/invoiceExport';
import type { MECountryCode } from '../config/meTaxResidency.config';

type TaxResidencySectionProps = {
  idPrefix: string;
  value: TaxResidencyState;
  onChange: (next: TaxResidencyState) => void;
  /** When a field is invalid (server-side or validation) */
  errorFieldId?: string;
  compact?: boolean;
};

/**
 * “Tax Residency & Location” group: searchable country + registry-driven fields.
 */
export default function TaxResidencySection({
  idPrefix,
  value,
  onChange,
  errorFieldId,
  compact,
}: TaxResidencySectionProps) {
  const setCountry = (code: MECountryCode | null) => {
    onChange({
      countryCode: code,
      additionalData: {},
    });
  };

  const setField = (fieldId: string, v: string) => {
    onChange({
      ...value,
      additionalData: { ...value.additionalData, [fieldId]: v },
    });
  };

  return (
    <div className={compact ? 'space-y-3' : 'space-y-5'}>
      <div>
        <h3 className="text-sm font-bold tracking-widest uppercase text-ink-black/50 mb-2">
          Tax residency &amp; location
        </h3>
        <p className="text-xs text-ink-black/50 mb-3 max-w-2xl">
          Choose where your business is tax-resident for this invoice. Additional identifiers come from
          local rules; only the selected country&rsquo;s fields are shown.
        </p>
        <SearchableCountrySelect
          id={`${idPrefix}-country`}
          label="Tax residence country (Middle East & Cyprus)"
          value={value.countryCode}
          onChange={setCountry}
        />
      </div>
      {value.countryCode && (
        <div className="pt-1 border-t border-ink-black/10">
          <p className="text-xs font-bold tracking-widest uppercase text-ink-black/40 mb-3">
            Additional required data
          </p>
          <DynamicTaxFieldsForm
            countryCode={value.countryCode}
            values={value.additionalData}
            onChange={setField}
            idPrefix={idPrefix}
            errorFieldId={errorFieldId}
          />
        </div>
      )}
    </div>
  );
}
