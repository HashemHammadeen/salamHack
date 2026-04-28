import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE } from '../lib/apiBase';
import { Bell, BellOff, Radio } from 'lucide-react';

const canUseNotifications = () =>
  typeof window !== 'undefined' && 'Notification' in window && 'permission' in Notification;

export default function WebNotificationsPanel() {
  const [supported, setSupported] = useState(true);
  const [perm, setPerm] = useState<NotificationPermission | 'unsupported'>('default');
  const [backend, setBackend] = useState<{ vapid_public_key: string | null; note?: string } | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const syncPerm = useCallback(() => {
    if (!canUseNotifications()) {
      setSupported(false);
      setPerm('unsupported');
      return;
    }
    setSupported(true);
    setPerm(Notification.permission);
  }, []);

  useEffect(() => {
    syncPerm();
  }, [syncPerm]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/plugins/web_notifications/status`);
        if (!cancelled) setBackend(data);
      } catch {
        if (!cancelled) setBackend(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const requestPermission = async () => {
    setError(null);
    setOk(null);
    if (!canUseNotifications()) {
      setError('This browser does not support the Notification API.');
      return;
    }
    try {
      const p = await Notification.requestPermission();
      setPerm(p);
      if (p === 'granted') {
        setOk('You can test a notification below.');
      } else if (p === 'denied') {
        setError('Notifications are blocked. Change the setting in the browser address bar or site settings.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Permission request failed.');
    }
  };

  const testLocal = () => {
    setError(null);
    setOk(null);
    if (!canUseNotifications()) {
      setError('Notifications are not available.');
      return;
    }
    if (Notification.permission !== 'granted') {
      setError('Allow notifications first.');
      return;
    }
    try {
      const n = new Notification('FinanceFlow', {
        body: 'Test — you will see alerts like this for account activity when wired up.',
        tag: 'ff-test',
      });
      n.onclick = () => {
        window.focus();
        n.close();
      };
      setOk('A system notification was shown (check the OS notification center if you do not see a popup).');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not show a notification.');
    }
  };

  return (
    <div className="space-y-6">
      <section className="card p-6">
        <div className="flex items-start gap-3 mb-4">
          <Bell className="shrink-0 text-ink-black/60" size={24} aria-hidden />
          <div>
            <h2 className="text-lg font-medium mb-1">Browser notifications</h2>
            <p className="text-ink-black/70 text-sm max-w-2xl">
              This uses the browser&rsquo;s <strong>Notification</strong> API. Permission is per browser
              profile. HTTPS (or <code className="text-xs bg-ink-black/5 px-1 rounded">localhost</code>
              ) is required in most browsers. Server-driven Web Push can be added later with VAPID keys
              in the API environment.
            </p>
          </div>
        </div>

        {backend?.vapid_public_key && (
          <p className="text-sm text-ink-black/60 mb-4 flex items-center gap-2">
            <Radio size={16} className="shrink-0" aria-hidden />
            VAPID public key is set on the server for future push subscription flows.
          </p>
        )}

        {!supported && (
          <p className="text-signal-orange text-sm mb-4" role="alert">
            Your environment does not expose the Notification API.
          </p>
        )}

        {supported && (
          <div className="space-y-3">
            <p className="text-sm text-ink-black/80">
              Status:{' '}
              <strong>
                {perm === 'granted' && 'Allowed'}
                {perm === 'denied' && 'Blocked'}
                {perm === 'default' && 'Not asked yet'}
              </strong>
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              {perm !== 'granted' && (
                <button type="button" onClick={() => void requestPermission()} className="pill-button inline-flex items-center justify-center gap-2">
                  <Bell size={16} aria-hidden />
                  Allow notifications
                </button>
              )}
              <button
                type="button"
                onClick={testLocal}
                disabled={perm !== 'granted'}
                className="pill-button-secondary inline-flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Bell size={16} aria-hidden />
                Send test notification
              </button>
            </div>
            <p className="text-xs text-ink-black/50">
              Preference for which finance events should notify you can be added as this plugin evolves.
            </p>
          </div>
        )}

        {error && (
          <p className="text-signal-orange text-sm mt-4" role="alert">
            {error}
          </p>
        )}
        {ok && (
          <p className="text-emerald-800 text-sm mt-4" role="status">
            {ok}
          </p>
        )}
      </section>

      {supported && perm === 'denied' && (
        <section className="card p-4 flex items-start gap-2 text-sm text-ink-black/70">
          <BellOff className="shrink-0 text-ink-black/50" size={20} aria-hidden />
          <p>Reset the site permission in your browser settings to try again.</p>
        </section>
      )}
    </div>
  );
}
