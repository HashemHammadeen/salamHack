import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { listMECountriesForSearch } from '../services/taxResidencyRegistry';
import type { MECountryCode } from '../config/meTaxResidency.config';

const ALL = listMECountriesForSearch();

type SearchableCountrySelectProps = {
  id: string;
  value: MECountryCode | null;
  onChange: (code: MECountryCode | null) => void;
  /** Screen reader label */
  label: string;
  disabled?: boolean;
};

function matches(q: string, name: string, code: string) {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  return name.toLowerCase().includes(s) || code.toLowerCase().includes(s);
}

export default function SearchableCountrySelect({
  id,
  value,
  onChange,
  label,
  disabled,
}: SearchableCountrySelectProps) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selected = value ? ALL.find((c) => c.code === value) : null;
  const filtered = ALL.filter((c) => matches(query, c.name, c.code));

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open, close]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, close]);

  const showButtonLabel = selected ? `${selected.name} (${selected.code})` : 'Select country…';

  return (
    <div ref={wrapRef} className="relative max-w-xl">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <button
        type="button"
        id={id}
        disabled={disabled}
        className="flex w-full items-center justify-between gap-2 rounded-2xl border-2 border-ink-black/15 bg-white/90 px-4 py-3 text-left text-sm text-ink-black outline-none transition-colors focus:border-ink-black disabled:opacity-50"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => {
          if (disabled) return;
          setOpen((o) => !o);
        }}
      >
        <span className={selected ? 'text-ink-black' : 'text-ink-black/50'}>{showButtonLabel}</span>
        <ChevronDown
          className={['h-4 w-4 shrink-0 text-ink-black/50 transition-transform', open && 'rotate-180'].join(
            ' '
          )}
          aria-hidden
        />
      </button>

      {open && (
        <div
          className="absolute z-50 mt-1 w-full overflow-hidden rounded-2xl border-2 border-ink-black/15 bg-canvas-cream shadow-xl"
          role="presentation"
        >
          <div className="flex items-center gap-2 border-b border-ink-black/10 px-3 py-2">
            <Search className="h-4 w-4 text-ink-black/40 shrink-0" aria-hidden />
            <input
              type="search"
              className="min-w-0 flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-ink-black/40"
              placeholder="Search by name or code…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              aria-controls={listId}
            />
          </div>
          <ul
            id={listId}
            ref={listRef}
            role="listbox"
            className="max-h-60 overflow-y-auto p-1"
            aria-label={label}
          >
            <li role="option">
              <button
                type="button"
                className="w-full rounded-xl px-3 py-2.5 text-left text-sm text-ink-black/60 hover:bg-ink-black/5"
                onClick={() => {
                  onChange(null);
                  close();
                }}
              >
                Clear selection
              </button>
            </li>
            {filtered.length === 0 && (
              <li className="px-3 py-4 text-sm text-ink-black/50">No matches</li>
            )}
            {filtered.map((c) => (
              <li key={c.code} role="option" aria-selected={value === c.code}>
                <button
                  type="button"
                  className={[
                    'w-full rounded-xl px-3 py-2.5 text-left text-sm',
                    value === c.code
                      ? 'bg-ink-black text-canvas-cream'
                      : 'text-ink-black hover:bg-ink-black/5',
                  ].join(' ')}
                  onClick={() => {
                    onChange(c.code);
                    close();
                  }}
                >
                  <span className="font-medium">{c.name}</span>
                  <span
                    className={[
                      'ml-2 font-mono text-xs',
                      value === c.code ? 'text-canvas-cream/80' : 'text-ink-black/50',
                    ].join(' ')}
                  >
                    {c.code}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
