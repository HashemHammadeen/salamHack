import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { API_BASE } from '../lib/apiBase';
import { useFinanceData } from '../context/FinanceDataContext';
import { Mail, Send, AlertCircle } from 'lucide-react';

type Status = {
  configured: boolean;
  host: string | null;
  port: number;
  user_set: boolean;
  from_address: string | null;
  use_tls: boolean;
};

export default function EmailNotificationsPanel() {
  const { tenantId } = useFinanceData();
  const headers = useMemo(() => ({ 'x-tenant-id': tenantId }), [tenantId]);
  const [status, setStatus] = useState<Status | null>(null);
  const [to, setTo] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const { data } = await axios.get<Status>(`${API_BASE}/plugins/email_notifications/status`, {
        headers,
      });
      setStatus(data);
    } catch (e) {
      if (axios.isAxiosError(e)) {
        setError(e.message);
      } else {
        setError('Could not load email status.');
      }
    }
  }, [headers]);

  useEffect(() => {
    void load();
  }, [load]);

  const sendTest = async () => {
    setError(null);
    setOk(null);
    const email = to.trim();
    if (!email) {
      setError('Enter a recipient address.');
      return;
    }
    setBusy(true);
    try {
      const { data } = await axios.post<{ message?: string }>(
        `${API_BASE}/plugins/email_notifications/test`,
        { to: email },
        { headers }
      );
      setOk(data?.message || 'Test email sent.');
    } catch (e) {
      if (axios.isAxiosError(e) && e.response?.data) {
        const d = e.response.data as { detail?: string | { msg: string }[] };
        if (typeof d.detail === 'string') {
          setError(d.detail);
        } else {
          setError('Request failed.');
        }
      } else {
        setError('Request failed. Is the API running?');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="card p-6">
        <div className="flex items-start gap-3 mb-4">
          <Mail className="shrink-0 text-ink-black/60" size={24} aria-hidden />
          <div>
            <h2 className="text-lg font-medium mb-1">SMTP email</h2>
            <p className="text-ink-black/70 text-sm max-w-2xl">
              The API sends mail using environment variables on the server (
              <code className="text-xs bg-ink-black/5 px-1 rounded">FF_SMTP_HOST</code>,{' '}
              <code className="text-xs bg-ink-black/5 px-1 rounded">FF_SMTP_PORT</code>,{' '}
              <code className="text-xs bg-ink-black/5 px-1 rounded">FF_SMTP_USER</code>,{' '}
              <code className="text-xs bg-ink-black/5 px-1 rounded">FF_SMTP_PASSWORD</code>,{' '}
              <code className="text-xs bg-ink-black/5 px-1 rounded">FF_SMTP_FROM</code>
              , optional <code className="text-xs bg-ink-black/5 px-1 rounded">FF_SMTP_USE_TLS</code>
              ). Restart the API after changing <code className="text-xs">.env</code>.
            </p>
          </div>
        </div>

        {status && (
          <div
            className={[
              'rounded-2xl border px-4 py-3 text-sm mb-4',
              status.configured
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                : 'border-amber-200 bg-amber-50 text-amber-950',
            ].join(' ')}
            role="status"
          >
            {status.configured ? (
              <p>
                <strong>Ready.</strong> Using {status.host}:{status.port}{' '}
                {status.use_tls ? '(STARTTLS)' : '(plain)'} as {status.from_address}.
              </p>
            ) : (
              <p className="flex items-start gap-2">
                <AlertCircle className="shrink-0 mt-0.5" size={18} aria-hidden />
                <span>SMTP is not fully configured. Set the environment variables on the host that runs the API.</span>
              </p>
            )}
          </div>
        )}

        <label className="block text-sm text-ink-black/80 mb-1">Send test to</label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="email"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            autoComplete="email"
            placeholder="you@example.com"
            className="flex-1 min-w-0 border border-ink-black/20 rounded-xl px-3 py-2"
            disabled={busy}
          />
          <button
            type="button"
            onClick={() => void sendTest()}
            disabled={busy || !status?.configured}
            className="pill-button inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Send size={16} aria-hidden />
            {busy ? 'Sending…' : 'Send test'}
          </button>
        </div>
        {error && <p className="text-signal-orange text-sm mt-2">{error}</p>}
        {ok && <p className="text-emerald-800 text-sm mt-2">{ok}</p>}
      </section>
    </div>
  );
}
