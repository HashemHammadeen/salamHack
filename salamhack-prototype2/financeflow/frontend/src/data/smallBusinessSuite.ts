/** Content for the Small business suite plugin hub (roadmap + in-app links). */

export type FeatureStatus = 'available' | 'partial' | 'planned';

export type SuiteFeature = {
  text: string;
  status: FeatureStatus;
  /** In-app route when status is available/partial */
  href?: string;
  note?: string;
};

export type SuiteModule = {
  id: string;
  title: string;
  blurb: string;
  features: SuiteFeature[];
};

export const SMALL_BUSINESS_MODULES: SuiteModule[] = [
  {
    id: 'invoicing',
    title: 'Invoicing',
    blurb: 'Professional documents and client-facing exports.',
    features: [
      {
        text: 'Create and send professional invoices (PDF export, custom branding)',
        status: 'available',
        href: '/plugin/invoice_gen',
        note: 'Invoice Generator plugin — also open from Clients.',
      },
      {
        text: 'Invoice status tracking (sent, viewed, paid, overdue)',
        status: 'planned',
        note: 'Workflow + webhooks can layer on the history & export surface.',
      },
      {
        text: 'Recurring invoices for retainer clients',
        status: 'planned',
      },
      {
        text: 'Multi-currency support',
        status: 'planned',
      },
    ],
  },
  {
    id: 'income_expense',
    title: 'Income & expense tracking',
    blurb: 'Tie spend to projects, clients, and categories.',
    features: [
      {
        text: 'Log income per project / client',
        status: 'partial',
        href: '/budget',
        note: 'Budget & cash flow + ledger; link clients from Contacts.',
      },
      {
        text: 'Categorize expenses (tools, travel, equipment)',
        status: 'partial',
        href: '/plugin/expense_categorizer',
        note: 'Smart Categorizer + category tags on entities.',
      },
      {
        text: 'Receipt capture (photo upload or OCR)',
        status: 'planned',
      },
    ],
  },
  {
    id: 'tax',
    title: 'Tax management',
    blurb: 'Estimates and tagging to support filing prep.',
    features: [
      {
        text: 'Estimated quarterly tax calculator',
        status: 'partial',
        href: '/plugin/tax_calculator',
      },
      {
        text: 'Tax category tagging per expense',
        status: 'partial',
        href: '/plugin/expense_categorizer',
      },
      {
        text: 'Annual summary export for filing',
        status: 'planned',
      },
    ],
  },
  {
    id: 'time',
    title: 'Time tracking',
    blurb: 'Optional layer for services businesses.',
    features: [
      { text: 'Log hours per project', status: 'planned' },
      { text: 'Auto-generate invoice from tracked time', status: 'planned' },
    ],
  },
  {
    id: 'payments',
    title: 'Payments',
    blurb: 'Collect money on the invoice surface.',
    features: [
      { text: 'Payment link on invoices (Stripe, PayPal)', status: 'planned' },
      { text: 'Partial payment and deposit support', status: 'planned' },
    ],
  },
  {
    id: 'ap_ar',
    title: 'Accounts payable & receivable',
    blurb: 'Who owes what, and what you owe.',
    features: [
      {
        text: "Track what's owed vs. what you owe",
        status: 'partial',
        href: '/contacts',
        note: 'Clients & suppliers + activity feed.',
      },
      {
        text: 'Vendor / supplier management',
        status: 'partial',
        href: '/contacts',
      },
    ],
  },
  {
    id: 'multi_user',
    title: 'Multi-user access',
    blurb: 'Team-safe operations (future).',
    features: [
      { text: 'Role-based permissions (owner, accountant, employee)', status: 'planned' },
      { text: 'Audit logs', status: 'planned' },
    ],
  },
  {
    id: 'payroll',
    title: 'Payroll (basic)',
    blurb: 'Simple salary records and documents.',
    features: [
      { text: 'Employee salary records', status: 'planned' },
      { text: 'Pay stub generation', status: 'planned' },
    ],
  },
  {
    id: 'inventory',
    title: 'Inventory management',
    blurb: 'For product-led small businesses.',
    features: [
      { text: 'Stock levels, COGS tracking', status: 'planned' },
    ],
  },
  {
    id: 'reporting',
    title: 'Financial reporting',
    blurb: 'Statements and flexible periods.',
    features: [
      { text: 'Profit & Loss statement', status: 'planned' },
      { text: 'Balance sheet', status: 'planned' },
      { text: 'Cash flow statement', status: 'partial', href: '/analytics', note: 'Cash & analytics views today.' },
      { text: 'Customizable date ranges', status: 'partial', href: '/analytics' },
    ],
  },
  {
    id: 'bank',
    title: 'Bank reconciliation',
    blurb: 'Connect and match real money movement.',
    features: [
      { text: 'Connect bank accounts (Plaid)', status: 'planned' },
      { text: 'Auto-match transactions to records', status: 'planned' },
    ],
  },
];
