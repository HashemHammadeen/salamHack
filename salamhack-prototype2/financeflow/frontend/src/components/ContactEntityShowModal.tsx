type ContactLike = {
  id: string;
  name: string;
  email: string;
  total_billed: number;
};

type ContactEntityShowModalProps = {
  kind: 'client' | 'supplier';
  record: ContactLike;
  onClose: () => void;
};

export default function ContactEntityShowModal({ kind, record, onClose }: ContactEntityShowModalProps) {
  const title = kind === 'client' ? 'Client' : 'Supplier';
  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-ink-black/40 backdrop-blur-sm border-0 cursor-default w-full h-full"
        onClick={onClose}
        aria-label="Close"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-show-title"
        className="relative w-full sm:max-w-md bg-canvas-cream sm:rounded-3xl shadow-2xl border border-ink-black/10 p-6 sm:p-8 outline-none"
      >
        <div className="flex justify-between items-start gap-3 mb-6">
          <div>
            <p className="text-xs font-bold tracking-widest uppercase text-ink-black/50 mb-1">{title}</p>
            <h2 id="contact-show-title" className="text-xl font-medium text-ink-black pr-2">
              {record.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full w-10 h-10 text-lg leading-none border border-ink-black/20 hover:bg-ink-black/5"
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>
        <dl className="space-y-4 text-sm">
          <div>
            <dt className="text-xs font-bold tracking-widest uppercase text-ink-black/45 mb-1">Record ID</dt>
            <dd className="font-mono text-xs break-all text-ink-black/90">{record.id}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold tracking-widest uppercase text-ink-black/45 mb-1">Legal / display name</dt>
            <dd className="text-ink-black">{record.name}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold tracking-widest uppercase text-ink-black/45 mb-1">Email</dt>
            <dd>
              {record.email ? (
                <a href={`mailto:${record.email}`} className="text-ink-black underline underline-offset-2 break-all">
                  {record.email}
                </a>
              ) : (
                <span className="text-ink-black/50">—</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-bold tracking-widest uppercase text-ink-black/45 mb-1">Total billed</dt>
            <dd className="text-lg font-medium tabular-nums">${record.total_billed.toLocaleString(undefined, { maximumFractionDigits: 2 })}</dd>
          </div>
        </dl>
        <p className="text-xs text-ink-black/45 mt-6">
          This is the full record returned by the API. Add more fields on the server if you need
          addresses or tax IDs in the directory.
        </p>
        <button type="button" onClick={onClose} className="mt-6 pill-button w-full sm:w-auto">
          Close
        </button>
      </div>
    </div>
  );
}
