import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE } from '../lib/apiBase';
import { Mail, Send, AlertCircle, Save, Trash2 } from 'lucide-react';

type Status = {
  configured: boolean;
  host: string | null;
  port: number;
  user_set: boolean;
  from_address: string | null;
  use_tls: boolean;
  source?: 'tenant' | 'env';
};

type Config = {
  host: string | null;
  port: number;
  user: string | null;
  from_address: string | null;
  use_tls: boolean;
  has_password: boolean;
  source: 'tenant' | 'env';
};

export default function EmailNotificationsPanel() {
  const [status, setStatus] = useState<Status | null>(null);
  const [host, setHost] = useState('');
  const [port, setPort] = useState('587');
  const [user, setUser] = useState('');
  const [fromAddress, setFromAddress] = useState('');
  const [useTls, setUseTls] = useState(true);
  const [password, setPassword] = useState('');
  const [configSource, setConfigSource] = useState<'tenant' | 'env' | null>(null);
  const [to, setTo] = useState('');
  const [busy, setBusy] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      const { data } = await axios.get<Status>(`${API_BASE}/plugins/email_notifications/status`);
      setStatus(data);
    } catch {
      setStatus(null);
    }
  }, []);

  const loadConfig = useCallback(async () => {
    setError(null);
    try {
      const { data } = await axios.get<Config>(`${API_BASE}/plugins/email_notifications/config`);
      setHost(data.host ?? '');
      setPort(String(data.port ?? 587));
      setUser(data.user ?? '');
      setFromAddress(data.from_address ?? '');
      setUseTls(data.use_tls);
      setPassword('');
      setConfigSource(data.source);
    } catch (e) {
      if (axios.isAxiosError(e)) {
        setError(e.message);
      } else {
        setError('Could not load SMTP settings.');
      }
    }
  }, []);

  const load = useCallback(async () => {
    await Promise.all([loadStatus(), loadConfig()]);
  }, [loadConfig, loadStatus]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveConfig = async () => {
    setError(null);
    setOk(null);
    setSaveBusy(true);
    try {
      const portNum = parseInt(port, 10);
      if (Number.isNaN(portNum) || portNum < 1 || portNum > 65535) {
        setError('Port must be between 1 and 65535.');
        return;
      }
      await axios.put(
        `${API_BASE}/plugins/email_notifications/config`,
        {
          host: host.trim(),
          port: portNum,
          user: user.trim(),
          from_address: fromAddress.trim(),
          use_tls: useTls,
          password: password.trim() || null,
        }
      );
      setOk('SMTP settings saved on the API server.');
      setPassword('');
      await load();
    } catch (e) {
      if (axios.isAxiosError(e) && e.response?.data) {
        const d = e.response.data as { detail?: string | { msg: string }[] };
        if (typeof d.detail === 'string') {
          setError(d.detail);
        } else {
          setError('Save failed.');
        }
      } else {
        setError('Save failed. Is the API running?');
      }
    } finally {
      setSaveBusy(false);
    }
  };

  const clearSaved = async () => {
    if (!window.confirm('Remove saved SMTP settings? Environment variables on the server will apply if set.')) {
      return;
    }
    setError(null);
    setOk(null);
    setSaveBusy(true);
    try {
      await axios.delete(`${API_BASE}/plugins/email_notifications/config`);
      setOk('Saved settings cleared.');
      setPassword('');
      await load();
    } catch (e) {
      if (axios.isAxiosError(e) && e.response?.data) {
        const d = e.response.data as { detail?: string };
        setError(typeof d.detail === 'string' ? d.detail : 'Could not clear settings.');
      } else {
        setError('Request failed.');
      }
    } finally {
      setSaveBusy(false);
    }
  };

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
        { to: email }
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

  const effectiveSource = status?.source ?? configSource;

  return (
    <div className="space-y-6">
      <section className="card p-6">
        <div className="flex items-start gap-3 mb-4">
          <Mail className="shrink-0 text-ink-black/60" size={24} aria-hidden />
          <div>
            <h2 className="text-lg font-medium mb-1">SMTP settings</h2>
            <p className="text-ink-black/70 text-sm max-w-2xl">
              Values are stored on the API server. You can also set{' '}
              <code className="text-xs bg-ink-black/5 px-1 rounded">FF_SMTP_*</code> in the
              server environment; if you do not save a password in the form, the server default is used when
              present.
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
                <strong>Ready to send.</strong>{' '}
                {effectiveSource === 'tenant' ? 'Using saved app settings' : 'Using environment defaults'}
                {status.host ? (
                  <>
                    : {status.host}:{status.port} {status.use_tls ? '(STARTTLS)' : '(plain)'} · from{' '}
                    {status.from_address}
                  </>
                ) : null}
                .
              </p>
            ) : (
              <p className="flex items-start gap-2">
                <AlertCircle className="shrink-0 mt-0.5" size={18} aria-hidden />
                <span>Fill in the form below and save, or configure FF_SMTP_* on the API host.</span>
              </p>
            )}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-xs font-bold tracking-wide uppercase text-ink-black/50">SMTP host</span>
            <input
              className="mt-1 w-full border border-ink-black/20 rounded-xl px-3 py-2"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              autoComplete="off"
              placeholder="smtp.example.com"
            />
          </label>
          <label className="block">
            <span className="text-xs font-bold tracking-wide uppercase text-ink-black/50">Port</span>
            <input
              type="number"
              min={1}
              max={65535}
              className="mt-1 w-full border border-ink-black/20 rounded-xl px-3 py-2"
              value={port}
              onChange={(e) => setPort(e.target.value)}
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs font-bold tracking-wide uppercase text-ink-black/50">Username</span>
            <input
              className="mt-1 w-full border border-ink-black/20 rounded-xl px-3 py-2"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              autoComplete="off"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs font-bold tracking-wide uppercase text-ink-black/50">From address</span>
            <input
              type="email"
              className="mt-1 w-full border border-ink-black/20 rounded-xl px-3 py-2"
              value={fromAddress}
              onChange={(e) => setFromAddress(e.target.value)}
              autoComplete="off"
              placeholder="noreply@yourdomain.com"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs font-bold tracking-wide uppercase text-ink-black/50">Password</span>
            <input
              type="password"
              className="mt-1 w-full border border-ink-black/20 rounded-xl px-3 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              placeholder={
                status?.configured || configSource === 'tenant'
                  ? 'Leave blank to keep the current password'
                  : 'App password or SMTP password'
              }
            />
            <span className="text-xs text-ink-black/50 mt-1 block">
              {configSource === 'tenant' || (status?.source === 'tenant')
                ? 'Leave blank when saving to keep the existing password.'
                : 'Required to save unless FF_SMTP_PASSWORD is set on the server.'}
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer sm:col-span-2">
            <input
              type="checkbox"
              className="rounded border-ink-black/30"
              checked={useTls}
              onChange={(e) => setUseTls(e.target.checked)}
            />
            <span className="text-sm">Use TLS (STARTTLS)</span>
          </label>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => void saveConfig()}
            disabled={saveBusy}
            className="pill-button inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save size={16} aria-hidden />
            {saveBusy ? 'Saving…' : 'Save SMTP settings'}
          </button>
          {effectiveSource === 'tenant' && (
            <button
              type="button"
              onClick={() => void clearSaved()}
              disabled={saveBusy}
              className="pill-button-secondary inline-flex items-center justify-center gap-2 text-ink-black/80 border-ink-black/25"
            >
              <Trash2 size={16} aria-hidden />
              Clear saved settings
            </button>
          )}
        </div>
      </section>

      <section className="card p-6">
        <h3 className="text-sm font-bold tracking-widest uppercase text-ink-black/50 mb-3">Send test email</h3>
        <label className="block text-sm text-ink-black/80 mb-1">Recipient</label>
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
