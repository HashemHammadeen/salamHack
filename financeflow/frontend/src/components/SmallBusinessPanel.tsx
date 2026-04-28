import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeftRight,
  ArrowRight,
  Banknote,
  BarChart3,
  Calculator,
  Clock,
  CreditCard,
  FileText,
  Link2,
  Package,
  Sparkles,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { API_BASE } from '../lib/apiBase';
import { SMALL_BUSINESS_MODULES, type FeatureStatus } from '../data/smallBusinessSuite';

const MODULE_ICONS: Record<string, LucideIcon> = {
  invoicing: FileText,
  income_expense: Wallet,
  tax: Calculator,
  time: Clock,
  payments: CreditCard,
  ap_ar: ArrowLeftRight,
  multi_user: Users,
  payroll: Banknote,
  inventory: Package,
  reporting: BarChart3,
  bank: Link2,
};

function statusLabel(s: FeatureStatus): string {
  if (s === 'available') return 'In app';
  if (s === 'partial') return 'Partial';
  return 'Planned';
}

function statusClass(s: FeatureStatus): string {
  if (s === 'available') return 'bg-emerald-100 text-emerald-900';
  if (s === 'partial') return 'bg-amber-100 text-amber-900';
  return 'bg-ink-black/[0.06] text-ink-black/70';
}

export default function SmallBusinessPanel() {
  const [apiVersion, setApiVersion] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    axios
      .get<{ version?: string }>(`${API_BASE}/plugins/small_business/health`)
      .then((r) => {
        if (!cancelled && r.data?.version) setApiVersion(r.data.version);
      })
      .catch(() => {
        if (!cancelled) setApiVersion(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const quickLinks = useMemo(
    () => [
      { to: '/plugin/invoice_gen', label: 'Invoice export' },
      { to: '/contacts', label: 'Clients & suppliers' },
      { to: '/budget', label: 'Budget & cash flow' },
      { to: '/analytics', label: 'Cash & analytics' },
      { to: '/plugin/tax_calculator', label: 'Tax calculator' },
      { to: '/plugin/expense_categorizer', label: 'Smart categorizer' },
    ],
    []
  );

  return (
    <div className="space-y-8">
      <section className="card p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4 justify-between">
          <div className="flex items-start gap-3">
            <div className="h-11 w-11 rounded-2xl bg-ink-black text-canvas-cream flex items-center justify-center shrink-0">
              <Sparkles size={22} strokeWidth={1.75} aria-hidden />
            </div>
            <div>
              <h2 className="text-lg font-medium text-ink-black mb-1">How to use this suite</h2>
              <p className="text-sm text-ink-black/70 max-w-3xl">
                Piecemint already includes several building blocks for small businesses (invoicing, tax
                estimates, categorization, budgeting). This page maps each capability to what you can do
                today and what is on the roadmap—payment links, bank feeds, inventory, and team permissions
                will land as separate plugin and API work.
              </p>
              {apiVersion && (
                <p className="text-xs text-ink-black/45 mt-2">Plugin API v{apiVersion}</p>
              )}
            </div>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          {quickLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="pill-button-secondary inline-flex items-center gap-1.5 text-sm no-underline"
            >
              {l.label}
              <ArrowRight size={14} aria-hidden />
            </Link>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6">
        {SMALL_BUSINESS_MODULES.map((mod) => {
          const Icon = MODULE_ICONS[mod.id] ?? FileText;
          return (
            <section
              key={mod.id}
              className="card p-5 md:p-6 border border-ink-black/[0.06]"
              aria-labelledby={`sb-${mod.id}-title`}
            >
              <div className="flex items-start gap-3 mb-4">
                <Icon className="shrink-0 text-ink-black/45 mt-0.5" size={22} strokeWidth={1.75} aria-hidden />
                <div>
                  <h3 id={`sb-${mod.id}-title`} className="text-base font-medium text-ink-black">
                    {mod.title}
                  </h3>
                  <p className="text-sm text-ink-black/55 mt-0.5">{mod.blurb}</p>
                </div>
              </div>
              <ul className="space-y-4" role="list">
                {mod.features.map((f, i) => (
                  <li
                    key={`${mod.id}-${i}`}
                    className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-ink-black/90">{f.text}</p>
                      {f.note && <p className="text-xs text-ink-black/50 mt-1">{f.note}</p>}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0 sm:justify-end">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-lg ${statusClass(f.status)}`}
                      >
                        {statusLabel(f.status)}
                      </span>
                      {f.href && (
                        <Link
                          to={f.href}
                          className="text-sm font-medium text-signal-orange hover:underline underline-offset-2"
                        >
                          Open
                        </Link>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <p className="text-xs text-ink-black/45 max-w-3xl">
        Roadmap items (Plaid, Stripe, payroll, roles) require backend scope, compliance review, and tests
        before they ship. Enable other plugins from the plugin library as they land.
      </p>
    </div>
  );
}
