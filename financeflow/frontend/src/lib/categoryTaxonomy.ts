/**
 * Global baseline categories for every entity type. AI-suggested or user-typed
 * labels that are not in these lists are appended to the live registry in localStorage.
 */
export const ENTITY_KINDS = ['client', 'supplier', 'transaction', 'stockholder'] as const;
export type EntityKind = (typeof ENTITY_KINDS)[number];

export const BASE_CLIENT_CATEGORIES: readonly string[] = [
  'Enterprise',
  'Mid-market (SMB)',
  'Small business',
  'Startup',
  'Government & public sector',
  'Non-profit',
  'Individual & sole proprietor',
  'Education & research',
  'Healthcare & life sciences',
  'Unclassified',
] as const;

export const BASE_SUPPLIER_CATEGORIES: readonly string[] = [
  'Software & SaaS',
  'Cloud & infrastructure',
  'Professional & legal',
  'Accounting & tax',
  'Payroll & HR',
  'Logistics & shipping',
  'Office & supplies',
  'Marketing & creative',
  'Utilities & telecom',
  'Facilities & rent',
  'Banking & payment fees',
  'Insurance',
  'Travel & events',
  'Hardware & equipment',
  'Other vendor',
] as const;

export const BASE_TRANSACTION_CATEGORIES: readonly string[] = [
  'Payroll & contractors',
  'Software & subscriptions',
  'Cloud & hosting',
  'Travel & lodging',
  'Meals & entertainment',
  'Rent & facilities',
  'Marketing & ads',
  'Professional fees',
  'Taxes & compliance',
  'Insurance',
  'Utilities',
  'Equipment & fixed assets',
  'Transfers & internal',
  'Interest & bank fees',
  'Revenue & sales',
  'Uncategorized',
] as const;

export const BASE_STOCKHOLDER_CATEGORIES: readonly string[] = [
  'Founder & executive',
  'Angel & seed investor',
  'Venture & institutional',
  'Employee equity pool',
  'Family & friends',
  'Advisory (non-investor)',
  'Other / unspecified',
] as const;

const BASE_BY_KIND: Record<EntityKind, readonly string[]> = {
  client: BASE_CLIENT_CATEGORIES,
  supplier: BASE_SUPPLIER_CATEGORIES,
  transaction: BASE_TRANSACTION_CATEGORIES,
  stockholder: BASE_STOCKHOLDER_CATEGORIES,
};

export function baseCategoriesForKind(kind: EntityKind): string[] {
  return [...BASE_BY_KIND[kind]];
}

export function isValidEntityKind(s: string): s is EntityKind {
  return (ENTITY_KINDS as readonly string[]).includes(s);
}
