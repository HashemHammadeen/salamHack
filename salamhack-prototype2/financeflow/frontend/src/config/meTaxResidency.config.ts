/**
 * Middle East & Cyprus tax-residency metadata for invoicing and tax calculator.
 * ISO 3166-1 alpha-2 keys: BH, CY, EG, IR, IQ, JO, KW, LB, OM, PS, QA, SA, SY, TR, AE, YE.
 * UI reads only through `taxResidencyRegistry` / `DynamicTaxFieldsForm` (Strategy: add
 * a country + `additionalFields` here — no component changes).
 */

export const ME_COUNTRY_CODES = [
  'BH',
  'CY',
  'EG',
  'IR',
  'IQ',
  'JO',
  'KW',
  'LB',
  'OM',
  'PS',
  'QA',
  'SA',
  'SY',
  'TR',
  'AE',
  'YE',
] as const;

export type MECountryCode = (typeof ME_COUNTRY_CODES)[number];

/** Single additional field; ids are stable storage keys. */
export type TaxAdditionalFieldDefinition = {
  id: string;
  label: string;
  type: 'text' | 'email' | 'tel';
  required: boolean;
  placeholder?: string;
  /** Shown under the input for compliance hints */
  helperText?: string;
  maxLength?: number;
  autoComplete?: string;
};

export type CountryTaxResidencyConfig = {
  name: string;
  /** Jurisdiction-specific lines for invoices; empty = no extra lines */
  additionalFields: TaxAdditionalFieldDefinition[];
};

/**
 * One entry per supported country. New country = new key + metadata only.
 */
export const ME_TAX_RESIDENCY_BY_COUNTRY: Record<MECountryCode, CountryTaxResidencyConfig> = {
  BH: {
    name: 'Bahrain',
    additionalFields: [
      {
        id: 'bahrain_vat_number',
        label: 'VAT registration number',
        type: 'text',
        required: true,
        placeholder: 'e.g. 000000-0000',
        helperText: 'As shown on NBR-issued registration.',
      },
    ],
  },
  CY: {
    name: 'Cyprus',
    additionalFields: [
      {
        id: 'cy_tic',
        label: 'TIC (tax identification code)',
        type: 'text',
        required: true,
        placeholder: '8 digits',
        maxLength: 16,
      },
    ],
  },
  EG: {
    name: 'Egypt',
    additionalFields: [
      {
        id: 'egypt_tin',
        label: 'Tax identification number (TIN)',
        type: 'text',
        required: true,
        placeholder: '9-digit TIN',
        maxLength: 16,
      },
    ],
  },
  IR: {
    name: 'Iran',
    additionalFields: [
      {
        id: 'iran_national_id',
        label: 'Economic / national ID (where applicable)',
        type: 'text',
        required: true,
        placeholder: 'For invoice disclosure',
        helperText: 'Use the number required for B2B tax compliance.',
      },
    ],
  },
  IQ: {
    name: 'Iraq',
    additionalFields: [
      {
        id: 'iraq_tin',
        label: 'Tax / trade registration number',
        type: 'text',
        required: true,
        placeholder: 'As registered with GCT',
      },
    ],
  },
  JO: {
    name: 'Jordan',
    additionalFields: [
      {
        id: 'jordan_tin',
        label: 'National tax number (TIN)',
        type: 'text',
        required: true,
        placeholder: 'Income & sales tax TIN',
        helperText: 'From Jordan Tax / ISTD registration.',
        maxLength: 32,
      },
    ],
  },
  KW: {
    name: 'Kuwait',
    additionalFields: [
      {
        id: 'kuwait_tin',
        label: 'Tax identification number (where assigned)',
        type: 'text',
        required: false,
        placeholder: 'If registered for business tax',
      },
    ],
  },
  LB: {
    name: 'Lebanon',
    additionalFields: [
      {
        id: 'lebanon_tin',
        label: 'TIN / financial number',
        type: 'text',
        required: true,
        placeholder: 'Fiscal / tax number',
      },
    ],
  },
  OM: {
    name: 'Oman',
    additionalFields: [
      {
        id: 'oman_vat_tin',
        label: 'VAT TIN (if registered)',
        type: 'text',
        required: true,
        placeholder: 'Oman VAT TIN',
      },
    ],
  },
  PS: {
    name: 'Palestine',
    additionalFields: [
      {
        id: 'palestine_tin',
        label: 'Tax / registration identifier',
        type: 'text',
        required: true,
        placeholder: 'As used on statutory invoices',
      },
    ],
  },
  QA: {
    name: 'Qatar',
    additionalFields: [
      {
        id: 'qatar_tin',
        label: 'Tax identification number (where issued)',
        type: 'text',
        required: false,
        placeholder: 'If applicable to your entity',
      },
    ],
  },
  SA: {
    name: 'Saudi Arabia',
    additionalFields: [
      {
        id: 'zatca_registration_number',
        label: 'ZATCA registration number',
        type: 'text',
        required: true,
        placeholder: '15 characters, ZATCA / VAT',
        helperText: 'ZATCA / VAT e-invoicing commercial registration for Saudi Arabia.',
        maxLength: 32,
      },
    ],
  },
  SY: {
    name: 'Syria',
    additionalFields: [
      {
        id: 'syria_fiscal',
        label: 'Fiscal / tax registration reference',
        type: 'text',
        required: true,
        placeholder: 'For invoice disclosure',
      },
    ],
  },
  TR: {
    name: 'Turkey',
    additionalFields: [
      {
        id: 'tr_vkn',
        label: 'Vergi Kimlik No (VKN)',
        type: 'text',
        required: true,
        placeholder: '10-digit VKN',
        maxLength: 11,
      },
    ],
  },
  AE: {
    name: 'United Arab Emirates',
    additionalFields: [
      {
        id: 'uae_trn',
        label: 'Tax registration number (TRN)',
        type: 'text',
        required: true,
        placeholder: '15-digit TRN',
        helperText: 'Emirates FTA tax registration for UAE.',
        maxLength: 20,
      },
    ],
  },
  YE: {
    name: 'Yemen',
    additionalFields: [
      {
        id: 'yemen_tin',
        label: 'Tax / business identifier',
        type: 'text',
        required: true,
        placeholder: 'If applicable in your case',
      },
    ],
  },
};
