import type { InvoiceExportConfig, InvoiceOutputFormat, InvoiceFontFamily } from '../types/invoiceExport';
import InvoiceDocumentForm from './InvoiceDocumentForm';

const formats: { id: InvoiceOutputFormat; label: string; hint: string }[] = [
  { id: 'pdf', label: 'PDF', hint: 'ReportLab' },
  { id: 'xlsx', label: 'Excel', hint: '.xlsx' },
  { id: 'docx', label: 'Word', hint: '.docx' },
];

const fonts: { id: InvoiceFontFamily; label: string }[] = [
  { id: 'Helvetica', label: 'Helvetica (sans)' },
  { id: 'Times-Roman', label: 'Times (serif)' },
  { id: 'Courier', label: 'Courier (mono)' },
];

const MAX_LOGO_DATA_URL_CHARS = 500_000;

function normalizeHex(v: string): string {
  const t = v.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(t)) return t;
  return t.startsWith('#') ? t : `#${t}`;
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result ?? ''));
    r.onerror = () => reject(new Error('read failed'));
    r.readAsDataURL(file);
  });
}

type InvoiceExportFormProps = {
  idPrefix: string;
  value: InvoiceExportConfig;
  onChange: (patch: Partial<InvoiceExportConfig>) => void;
  onResetToDefaults: () => void;
  /** Collapse outer spacing for compact layout (e.g. modal) */
  compact?: boolean;
};

export default function InvoiceExportForm({
  idPrefix,
  value: c,
  onChange,
  onResetToDefaults,
  compact,
}: InvoiceExportFormProps) {
  const sp = compact ? 'space-y-4' : 'space-y-8';
  return (
    <div className={sp}>
      <div>
        <InvoiceDocumentForm
          idPrefix={idPrefix}
          value={c.document}
          onChange={(document) => onChange({ document })}
          compact={compact}
        />
      </div>

      <div>
        <h3 className="text-sm font-bold tracking-widest uppercase text-ink-black/50 mb-3">
          Output format
        </h3>
        <div
          className="flex flex-wrap gap-2"
          role="radiogroup"
          aria-label="Invoice file format"
        >
          {formats.map((f) => (
            <label
              key={f.id}
              className={[
                'inline-flex items-center gap-2 rounded-2xl border-2 px-3 py-2.5 sm:px-4 sm:py-3 cursor-pointer transition-colors',
                c.outputFormat === f.id
                  ? 'border-ink-black bg-ink-black text-canvas-cream'
                  : 'border-ink-black/15 bg-white/80 hover:border-ink-black/30',
              ].join(' ')}
            >
              <input
                type="radio"
                className="sr-only"
                name={`${idPrefix}-invoice-format`}
                checked={c.outputFormat === f.id}
                onChange={() => onChange({ outputFormat: f.id })}
              />
              <span className="text-sm font-medium">{f.label}</span>
              <span
                className={[
                  'text-xs',
                  c.outputFormat === f.id ? 'text-canvas-cream/80' : 'text-ink-black/50',
                ].join(' ')}
              >
                {f.hint}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="max-w-2xl space-y-4">
        <div>
          <h3 className="text-sm font-bold tracking-widest uppercase text-ink-black/50 mb-2">Logo (optional)</h3>
          <p className="text-xs text-ink-black/50 mb-3">
            Use a <strong>link</strong> (server fetches HTTPS) or upload a <strong>file from this device</strong> — the
            image is stored in this browser with your invoice settings. When both are set, the uploaded file wins.
          </p>
        </div>
        <div>
          <label htmlFor={`${idPrefix}-logo-file`} className="text-xs font-bold tracking-widest uppercase text-ink-black/45 block mb-1.5">
            From local storage (file)
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <input
              id={`${idPrefix}-logo-file`}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="text-sm max-w-full"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                void (async () => {
                  try {
                    const dataUrl = await fileToDataUrl(f);
                    if (dataUrl.length > MAX_LOGO_DATA_URL_CHARS) {
                      window.alert('Image is too large for browser storage. Use a smaller file or a URL.');
                      return;
                    }
                    onChange({ logoDataUrl: dataUrl });
                  } catch {
                    window.alert('Could not read the file.');
                  }
                })();
                e.target.value = '';
              }}
            />
            {c.logoDataUrl ? (
              <>
                <span className="text-xs text-ink-black/50">Saved in this browser</span>
                <button
                  type="button"
                  onClick={() => onChange({ logoDataUrl: '' })}
                  className="text-sm text-signal-orange underline underline-offset-2"
                >
                  Remove upload
                </button>
              </>
            ) : null}
          </div>
          {c.logoDataUrl ? (
            <div className="mt-3 flex items-center gap-4">
              <img
                src={c.logoDataUrl}
                alt="Logo preview"
                className="max-h-16 max-w-[180px] object-contain rounded-lg border border-ink-black/10 bg-white p-1"
              />
            </div>
          ) : null}
        </div>
        <div>
          <label htmlFor={`${idPrefix}-logo`} className="text-xs font-bold tracking-widest uppercase text-ink-black/45 block mb-1.5">
            Or image URL (HTTPS)
          </label>
          <input
            id={`${idPrefix}-logo`}
            type="url"
            value={c.logoUrl}
            onChange={(e) => onChange({ logoUrl: e.target.value })}
            placeholder="https://example.com/your-logo.png"
            className="w-full bg-white/80 border-b-2 border-ink-black/20 px-0 py-2 outline-none focus:border-ink-black"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-2xl">
        <div>
          <label
            htmlFor={`${idPrefix}-font`}
            className="text-sm font-bold tracking-widest uppercase text-ink-black/50 block mb-2"
          >
            Font
          </label>
          <select
            id={`${idPrefix}-font`}
            value={c.fontFamily}
            onChange={(e) => onChange({ fontFamily: e.target.value as InvoiceFontFamily })}
            className="w-full bg-white/80 border-2 border-ink-black/15 rounded-2xl px-4 py-3 outline-none focus:border-ink-black"
          >
            {fonts.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor={`${idPrefix}-size`}
            className="text-sm font-bold tracking-widest uppercase text-ink-black/50 block mb-2"
          >
            Base font size
          </label>
          <input
            id={`${idPrefix}-size`}
            type="number"
            min={8}
            max={24}
            value={c.fontSize}
            onChange={(e) => {
              const n = parseInt(e.target.value, 10);
              if (!Number.isNaN(n)) {
                onChange({ fontSize: Math.min(24, Math.max(8, n)) });
              }
            }}
            className="w-full bg-white/80 border-2 border-ink-black/15 rounded-2xl px-4 py-3 outline-none focus:border-ink-black tabular-nums"
          />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold tracking-widest uppercase text-ink-black/50 mb-3">Colors</h3>
        <div className="flex flex-wrap gap-4 sm:gap-6">
          <div className="flex items-end gap-3">
            <div>
              <label htmlFor={`${idPrefix}-primary`} className="text-xs text-ink-black/60 block mb-1">
                Primary
              </label>
              <input
                id={`${idPrefix}-primary`}
                type="color"
                value={c.primaryColor}
                onChange={(e) => onChange({ primaryColor: e.target.value })}
                className="h-10 sm:h-12 w-12 sm:w-14 cursor-pointer border-0 bg-transparent p-0"
                aria-label="Primary color"
              />
            </div>
            <input
              type="text"
              value={c.primaryColor}
              onChange={(e) => onChange({ primaryColor: normalizeHex(e.target.value) })}
              onBlur={() =>
                onChange({
                  primaryColor: normalizeHex(c.primaryColor),
                })
              }
              className="w-24 sm:w-28 border-b-2 border-ink-black/20 py-1 font-mono text-sm outline-none focus:border-ink-black"
              maxLength={7}
              aria-label="Primary color hex"
            />
          </div>
          <div className="flex items-end gap-3">
            <div>
              <label
                htmlFor={`${idPrefix}-secondary`}
                className="text-xs text-ink-black/60 block mb-1"
              >
                Secondary
              </label>
              <input
                id={`${idPrefix}-secondary`}
                type="color"
                value={c.secondaryColor}
                onChange={(e) => onChange({ secondaryColor: e.target.value })}
                className="h-10 sm:h-12 w-12 sm:w-14 cursor-pointer border-0 bg-transparent p-0"
                aria-label="Secondary color"
              />
            </div>
            <input
              type="text"
              value={c.secondaryColor}
              onChange={(e) => onChange({ secondaryColor: normalizeHex(e.target.value) })}
              onBlur={() =>
                onChange({
                  secondaryColor: normalizeHex(c.secondaryColor),
                })
              }
              className="w-24 sm:w-28 border-b-2 border-ink-black/20 py-1 font-mono text-sm outline-none focus:border-ink-black"
              maxLength={7}
              aria-label="Secondary color hex"
            />
          </div>
        </div>
      </div>

      <div>
        <button
          type="button"
          onClick={onResetToDefaults}
          className="text-sm font-medium text-ink-black/70 underline underline-offset-2 hover:text-ink-black"
        >
          Reset to defaults
        </button>
      </div>
    </div>
  );
}
