import { useState } from 'react';
import { Download, Eye } from 'lucide-react';
import { useFinanceData } from '../context/FinanceDataContext';
import InvoiceDownloadModal from '../components/InvoiceDownloadModal';
import ContactEntityShowModal from '../components/ContactEntityShowModal';
import EntityCategorySelect from '../components/EntityCategorySelect';

export default function Contacts() {
  const { clients, suppliers, stockholders, isPluginActive } = useFinanceData();
  const inv = isPluginActive('invoice_gen');
  const [invoiceClient, setInvoiceClient] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [showClient, setShowClient] = useState<{
    id: string;
    name: string;
    email: string;
    total_billed: number;
  } | null>(null);
  const [showSupplier, setShowSupplier] = useState<{
    id: string;
    name: string;
    email: string;
    total_billed: number;
  } | null>(null);

  return (
    <div className="space-y-10 max-w-5xl">
      <header>
        <h1 className="text-3xl md:text-4xl font-medium tracking-tight mb-2">Clients & suppliers</h1>
        <p className="text-ink-black/70 max-w-2xl">
          Your customers and the businesses you pay, in one place. Set a category on each line by hand, or
          turn on <strong>Smart Categorizer</strong> in the plugin library, then run{' '}
          <strong>Smart categorization</strong> on the Smart Categorizer page to suggest categories for
          anything still open—suggestions you keep are remembered for next time.
        </p>
      </header>

      <div className="flex flex-col gap-12">
        <section>
          <div className="flex items-center gap-2 mb-6">
            <div className="w-2 h-2 rounded-full bg-ink-black" />
            <h2 className="text-sm font-bold tracking-widest uppercase text-ink-black/60">Clients</h2>
          </div>
          <div className="card overflow-x-auto">
            <table className="w-full text-left min-w-[520px]">
              <thead>
                <tr className="border-b border-ink-black/10">
                  <th className="pb-4 font-medium">Name</th>
                  <th className="pb-4 font-medium">Category</th>
                  <th className="pb-4 font-medium">Total billed</th>
                  <th className="pb-4 font-medium text-right w-[100px]">Show</th>
                  {inv && <th className="pb-4 font-medium text-right">Invoice</th>}
                </tr>
              </thead>
              <tbody>
                {clients.map((c: { id: string; name: string; email: string; total_billed: number }) => (
                  <tr key={c.id} className="border-b border-ink-black/5 last:border-0">
                    <td className="py-4 align-top">
                      <div className="font-medium">{c.name}</div>
                      <div className="text-sm text-ink-black/60">{c.email}</div>
                    </td>
                    <td className="py-4 align-top">
                      <EntityCategorySelect kind="client" entityId={c.id} />
                    </td>
                    <td className="py-4 align-top">${c.total_billed.toLocaleString()}</td>
                    <td className="py-4 text-right align-top">
                      <button
                        type="button"
                        onClick={() => setShowClient(c)}
                        className="inline-flex items-center justify-center gap-1 rounded-full border border-ink-black/20 px-3 py-1.5 text-xs font-medium hover:bg-ink-black hover:text-canvas-cream transition-colors"
                        title="View full record"
                      >
                        <Eye size={14} />
                        Show
                      </button>
                    </td>
                    {inv && (
                      <td className="py-4 text-right align-top">
                        <button
                          type="button"
                          onClick={() => setInvoiceClient({ id: c.id, name: c.name })}
                          className="w-10 h-10 rounded-full border border-ink-black/20 inline-flex items-center justify-center hover:bg-ink-black hover:text-canvas-cream transition-colors"
                          title="Download invoice — review format and branding"
                        >
                          <Download size={16} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {clients.length === 0 && (
                  <tr>
                    <td colSpan={inv ? 5 : 4} className="py-8 text-center text-ink-black/60">
                      No clients found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-6">
            <div className="w-2 h-2 rounded-full bg-ink-black" />
            <h2 className="text-sm font-bold tracking-widest uppercase text-ink-black/60">Suppliers</h2>
          </div>
          <div className="card overflow-x-auto">
            <table className="w-full text-left min-w-[520px]">
              <thead>
                <tr className="border-b border-ink-black/10">
                  <th className="pb-4 font-medium">Name</th>
                  <th className="pb-4 font-medium">Category</th>
                  <th className="pb-4 font-medium">Total billed</th>
                  <th className="pb-4 font-medium text-right w-[100px]">Show</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((s: { id: string; name: string; email: string; total_billed: number }) => (
                  <tr key={s.id} className="border-b border-ink-black/5 last:border-0">
                    <td className="py-4 align-top">
                      <div className="font-medium">{s.name}</div>
                      <div className="text-sm text-ink-black/60">{s.email}</div>
                    </td>
                    <td className="py-4 align-top">
                      <EntityCategorySelect kind="supplier" entityId={s.id} />
                    </td>
                    <td className="py-4 align-top">${s.total_billed.toLocaleString()}</td>
                    <td className="py-4 text-right align-top">
                      <button
                        type="button"
                        onClick={() => setShowSupplier(s)}
                        className="inline-flex items-center justify-center gap-1 rounded-full border border-ink-black/20 px-3 py-1.5 text-xs font-medium hover:bg-ink-black hover:text-canvas-cream transition-colors"
                        title="View full record"
                      >
                        <Eye size={14} />
                        Show
                      </button>
                    </td>
                  </tr>
                ))}
                {suppliers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-ink-black/60">
                      No suppliers found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section>
        <div className="flex items-center gap-2 mb-6">
          <div className="w-2 h-2 rounded-full bg-ink-black" />
          <h2 className="text-sm font-bold tracking-widest uppercase text-ink-black/60">Stockholders</h2>
        </div>
        <div className="card overflow-x-auto">
          <table className="w-full text-left min-w-[480px]">
            <thead>
              <tr className="border-b border-ink-black/10">
                <th className="pb-4 font-medium">Name</th>
                <th className="pb-4 font-medium">Category</th>
                <th className="pb-4 font-medium">Email</th>
                <th className="pb-4 font-medium">Share %</th>
              </tr>
            </thead>
            <tbody>
              {stockholders.map(
                (s: { id: string; name: string; email: string; share_percent: number | null }) => (
                  <tr key={s.id} className="border-b border-ink-black/5 last:border-0">
                    <td className="py-4 font-medium">{s.name}</td>
                    <td className="py-4 align-top">
                      <EntityCategorySelect kind="stockholder" entityId={s.id} />
                    </td>
                    <td className="py-4 text-sm text-ink-black/70">{s.email || '—'}</td>
                    <td className="py-4 tabular-nums">
                      {s.share_percent != null ? `${Number(s.share_percent).toFixed(1)}%` : '—'}
                    </td>
                  </tr>
                )
              )}
              {stockholders.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-ink-black/60">
                    No stockholders in this tenant.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {invoiceClient && (
        <InvoiceDownloadModal
          key={invoiceClient.id}
          onClose={() => setInvoiceClient(null)}
          clientId={invoiceClient.id}
          clientName={invoiceClient.name}
        />
      )}
      {showClient && (
        <ContactEntityShowModal
          kind="client"
          record={showClient}
          onClose={() => setShowClient(null)}
        />
      )}
      {showSupplier && (
        <ContactEntityShowModal
          kind="supplier"
          record={showSupplier}
          onClose={() => setShowSupplier(null)}
        />
      )}
    </div>
  );
}
