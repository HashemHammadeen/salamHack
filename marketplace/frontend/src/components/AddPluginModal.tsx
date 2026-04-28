import { useCallback, useEffect, useId, useRef, useState } from 'react';

type AddPluginModalProps = {
  onClose: () => void;
  onInstalled: () => void;
};

const ID_RE = /^[a-z][a-z0-9_]*$/;

export default function AddPluginModal({ onClose, onInstalled }: AddPluginModalProps) {
  const titleId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pluginId, setPluginId] = useState('');
  const [logicPy, setLogicPy] = useState('');
  const [manifestYaml, setManifestYaml] = useState('');
  const [useCustomManifest, setUseCustomManifest] = useState(false);
  const [overwrite, setOverwrite] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const onPickFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      setLogicPy(String(r.result || ''));
      setError(null);
    };
    r.readAsText(f, 'utf-8');
  }, []);

  const submit = async () => {
    setError(null);
    setSuccess(null);
    const id = pluginId.trim();
    if (!id || !ID_RE.test(id)) {
      setError('Plugin id must start with a letter and use only lowercase letters, numbers, and underscores.');
      return;
    }
    if (logicPy.trim().length < 20) {
      setError('Paste or choose a logic.py that defines a FastAPI router (e.g. router = APIRouter()).');
      return;
    }
    setBusy(true);
    
    // Simulate API call for marketplace demo
    setTimeout(() => {
        setBusy(false);
        setSuccess('Plugin files written successfully! (Demo mode)');
        onInstalled();
    }, 1500);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex h-[100dvh] w-full flex-col bg-[var(--color-canvas-cream)]"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="shrink-0 flex min-h-16 items-center justify-between gap-3 border-b border-ink-black/10 bg-white/90 px-4 py-4 backdrop-blur-md md:px-8">
        <h2 id={titleId} className="text-lg font-medium pr-2 md:text-xl">
          Add your plugin
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 flex h-11 w-11 items-center justify-center rounded-full border border-ink-black/20 text-lg leading-none hover:bg-ink-black/5"
          aria-label="Close"
        >
          ×
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-5 sm:px-6 md:px-10">
        <div className="mx-auto max-w-3xl space-y-4 text-sm text-ink-black/85">
          <p className="text-ink-black/70">
            Writes to <code className="text-xs bg-ink-black/5 px-1 rounded">plugins/&lt;id&gt;/</code> on the server
            that hosts the API. You must <strong>restart the API</strong> after a successful install.
          </p>
          <label className="block">
            <span className="text-xs font-bold tracking-wide uppercase text-ink-black/50">Plugin id (folder name)</span>
            <input
              className="mt-1 w-full border border-ink-black/20 rounded-xl px-3 py-2"
              value={pluginId}
              onChange={(e) => setPluginId(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              placeholder="e.g. my_reports"
              autoComplete="off"
            />
          </label>
          <div>
            <span className="text-xs font-bold tracking-wide uppercase text-ink-black/50">logic.py</span>
            <div className="mt-1 flex flex-wrap gap-2">
              <input ref={fileRef} type="file" accept=".py,text/x-python" className="sr-only" onChange={onPickFile} />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="pill-button-secondary text-sm py-1.5 px-3"
              >
                Choose .py file
              </button>
            </div>
            <textarea
              className="mt-2 w-full min-h-[200px] sm:min-h-[min(50vh,420px)] font-mono text-xs border border-ink-black/20 rounded-xl p-3"
              value={logicPy}
              onChange={(e) => {
                setLogicPy(e.target.value);
                setError(null);
              }}
              placeholder="Or paste your logic.py here (must include router = APIRouter())"
              spellCheck={false}
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="rounded border-ink-black/30"
              checked={useCustomManifest}
              onChange={(e) => setUseCustomManifest(e.target.checked)}
            />
            <span>Provide custom manifest.yaml (otherwise a default is generated from the plugin id)</span>
          </label>
          {useCustomManifest && (
            <label className="block">
              <span className="text-xs font-bold tracking-wide uppercase text-ink-black/50">manifest.yaml</span>
              <textarea
                className="mt-1 w-full min-h-[100px] font-mono text-xs border border-ink-black/20 rounded-xl p-3"
                value={manifestYaml}
                onChange={(e) => setManifestYaml(e.target.value)}
                placeholder={'name: "My Plugin"\ndescription: "..."\nversion: "1.0.0"'}
                spellCheck={false}
              />
            </label>
          )}
          <label className="flex items-center gap-2 cursor-pointer text-ink-black/80">
            <input
              type="checkbox"
              className="rounded border-ink-black/30"
              checked={overwrite}
              onChange={(e) => setOverwrite(e.target.checked)}
            />
            <span>Overwrite if this plugin id already exists on the server</span>
          </label>
          {error && <p className="text-[var(--color-signal-orange)] text-sm">{error}</p>}
          {success && <p className="text-emerald-800 text-sm whitespace-pre-wrap">{success}</p>}
        </div>
      </div>
      <div className="shrink-0 border-t border-ink-black/10 bg-white/90 px-4 py-4 backdrop-blur-md md:px-8">
        <div className="mx-auto flex max-w-3xl flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="pill-button-secondary w-full sm:w-auto">
            {success ? 'Close' : 'Cancel'}
          </button>
          {!success && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void submit()}
              className="pill-button w-full sm:w-auto disabled:opacity-50"
            >
              {busy ? 'Uploading…' : 'Install plugin'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
