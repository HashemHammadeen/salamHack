import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ArrowRight, FileText, Plug } from 'lucide-react';
import { useFinanceData } from '../context/FinanceDataContext';
import { PluginEnableSwitch } from '../components/PluginEnableSwitch';
import InvoiceExportSettings from '../components/InvoiceExportSettings';
import InvoiceHistorySection from '../components/InvoiceHistorySection';
import TaxCalculatorResidencyPanel from '../components/TaxCalculatorResidencyPanel';
import SmartCategorizeToolbar from '../components/SmartCategorizeToolbar';
import StockholdersPanel from '../components/StockholdersPanel';
import EmailNotificationsPanel from '../components/EmailNotificationsPanel';
import WebNotificationsPanel from '../components/WebNotificationsPanel';
import SmallBusinessPanel from '../components/SmallBusinessPanel';

export default function PluginPage() {
  const { pluginId = '' } = useParams();
  const {
    plugins,
    isPluginInstalled,
    isPluginEnabled,
    setPluginEnabled,
    taxReserve,
    forecast,
    searchExpenses,
  } = useFinanceData();

  const meta = plugins.installed.find((p) => p.id === pluginId);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  if (!pluginId) {
    return <p className="text-ink-black/60">No plugin selected.</p>;
  }

  if (!isPluginInstalled(pluginId) || !meta) {
    return (
      <div className="max-w-lg space-y-4">
        <Plug className="text-ink-black/30" size={40} aria-hidden />
        <h1 className="text-2xl font-medium">Plugin not available</h1>
        <p className="text-ink-black/70">
          <code className="bg-ink-black/5 px-1.5 py-0.5 rounded text-sm">{pluginId}</code> is
          not installed for this environment, or the list is out of date.
        </p>
        <Link to="/marketplace" className="pill-button inline-block no-underline">
          Open plugin library
        </Link>
      </div>
    );
  }

  if (!isPluginEnabled(pluginId)) {
    return (
      <div className="max-w-lg space-y-6">
        <Plug className="text-ink-black/30" size={40} aria-hidden />
        <div>
          <p className="text-xs font-bold tracking-widest uppercase text-ink-black/50 mb-2">Plugin</p>
          <h1 className="text-2xl font-medium mb-2">{meta.name}</h1>
          <p className="text-ink-black/70">
            This plugin is installed but turned off. Turn it on to use it in the app
            and show it in the sidebar.
          </p>
        </div>
        <div className="card p-4 max-w-md">
          <PluginEnableSwitch
            pluginId={pluginId}
            name={meta.name}
            enabled={false}
            onChange={(next) => setPluginEnabled(pluginId, next)}
          />
        </div>
        <Link to="/marketplace" className="text-sm font-medium text-signal-orange underline underline-offset-2">
          Manage all plugins
        </Link>
      </div>
    );
  }

  const onSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const results = await searchExpenses(searchQuery);
    setSearchResults(results);
  };

  return (
    <div
      className={[
        'space-y-8',
        pluginId === 'invoice_gen'
          ? 'max-w-4xl'
          : pluginId === 'stockholders' || pluginId === 'small_business'
            ? 'max-w-5xl'
            : pluginId === 'email_notifications' || pluginId === 'web_notifications'
              ? 'max-w-4xl'
              : 'max-w-3xl',
      ].join(' ')}
    >
      <header>
        <p className="text-xs font-bold tracking-widest uppercase text-ink-black/50 mb-2">Plugin</p>
        <h1 className="text-3xl md:text-4xl font-medium tracking-tight mb-2">{meta.name}</h1>
        <p className="text-ink-black/70">{meta.description}</p>
        <p className="text-sm text-ink-black/50 mt-2">Version {meta.version}</p>
      </header>

      {pluginId === 'tax_calculator' && (
        <div className="space-y-8">
          <TaxCalculatorResidencyPanel />
          {taxReserve && (
            <section className="card p-6">
              <h2 className="text-sm font-bold tracking-widest uppercase text-ink-black/50 mb-4">
                Tax estimate
              </h2>
              <p className="text-3xl font-medium mb-4">${taxReserve.tax_reserve.toLocaleString()}</p>
              <p className="text-ink-black/70 text-sm">
                At {taxReserve.tax_rate * 100}% of ${taxReserve.total_income.toLocaleString()}{' '}
                total income.
              </p>
            </section>
          )}
        </div>
      )}

      {pluginId === 'stockholders' && <StockholdersPanel />}

      {pluginId === 'email_notifications' && <EmailNotificationsPanel />}

      {pluginId === 'web_notifications' && <WebNotificationsPanel />}

      {pluginId === 'small_business' && <SmallBusinessPanel />}

      {pluginId === 'invoice_gen' && (
        <div className="space-y-8">
          <section className="card p-6 md:p-8">
            <div className="flex items-start gap-3 mb-8">
              <FileText className="shrink-0 text-ink-black/60" size={24} />
              <div>
                <h2 className="text-lg font-medium mb-2">Export invoices</h2>
                <p className="text-ink-black/70 text-sm mb-4 max-w-2xl">
                  Configure invoice data (number, dates, line items, customer &amp; supplier details,
                  notes), then file type and branding. Settings are saved in this browser.
                  On the clients page, download opens a dialog pre-filled with these options.
                </p>
                <Link
                  to="/contacts"
                  className="pill-button inline-flex items-center gap-2 no-underline w-fit"
                >
                  Go to clients <ArrowRight size={16} />
                </Link>
              </div>
            </div>
            <InvoiceExportSettings />
          </section>
          <InvoiceHistorySection />
        </div>
      )}

      {pluginId === 'expense_categorizer' && (
        <section className="card p-6">
          <h2 className="text-sm font-bold tracking-widest uppercase text-ink-black/50 mb-4">
            Smart search
          </h2>
          <form onSubmit={(e) => void onSearch(e)} className="flex flex-col sm:flex-row gap-4 mb-4">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => {
                const v = e.target.value;
                setSearchQuery(v);
                if (!v.trim()) {
                  setSearchResults([]);
                }
              }}
              placeholder='e.g. "cloud" for hosting spend'
              className="flex-1 bg-transparent border-b-2 border-ink-black/20 pb-2 outline-none text-lg focus:border-ink-black"
            />
            <button type="submit" className="pill-button shrink-0">
              Search
            </button>
          </form>
          {searchQuery.trim().length > 0 && searchResults.length > 0 && (
            <ul className="space-y-2" aria-label="Search results">
              {searchResults.map((r) => (
                <li
                  key={r.id}
                  className="flex justify-between p-3 rounded-xl bg-canvas-cream"
                >
                  <span>
                    {r.category} · {r.date}
                  </span>
                  <span className="font-medium">${Math.abs(r.amount).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="text-ink-black/60 text-sm max-w-2xl mt-4">
            <strong>AI:</strong> smart features use Google&rsquo;s tools. The person who runs the backend
            needs to add a Google API key in the server&rsquo;s <code className="text-xs">backend/.env</code>{' '}
            file first. Picking a different model is optional—the default is fine for most people.
          </p>
          <SmartCategorizeToolbar />
        </section>
      )}

      {pluginId === 'ai_prediction' && forecast.length > 0 && (
        <section>
          <h2 className="text-sm font-bold tracking-widest uppercase text-ink-black/50 mb-4">
            Forecast
          </h2>
          <div className="card h-72 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forecast}>
                <CartesianGrid strokeDasharray="3 3" stroke="#14141320" vertical={false} />
                <XAxis dataKey="month" stroke="#14141360" axisLine={false} tickLine={false} />
                <YAxis
                  stroke="#14141360"
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 20,
                    border: 'none',
                    boxShadow: 'rgba(0, 0, 0, 0.08) 0px 24px 48px 0px',
                  }}
                  formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Projected']}
                />
                <Line
                  type="monotone"
                  dataKey="projected_cashflow"
                  stroke="#CF4500"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#CF4500', strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {!['tax_calculator', 'invoice_gen', 'expense_categorizer', 'ai_prediction', 'stockholders', 'email_notifications', 'web_notifications', 'small_business'].includes(
        pluginId
      ) && (
        <section className="card p-6 text-ink-black/80 text-sm">
          <p>
            This plugin exposes its behavior via the API under{' '}
            <code className="text-xs bg-ink-black/5 px-1.5 py-0.5 rounded">
              /api/plugins/{pluginId}/
            </code>
            . Add a dedicated panel here when you extend the plugin.
          </p>
        </section>
      )}
    </div>
  );
}
