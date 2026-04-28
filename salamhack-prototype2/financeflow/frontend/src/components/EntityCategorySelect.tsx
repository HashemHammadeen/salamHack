import { useFinanceData } from '../context/FinanceDataContext';
import type { EntityKind } from '../lib/categoryTaxonomy';

type Props = {
  kind: EntityKind;
  entityId: string;
  /** Shown when no manual / AI assignment exists (e.g. API `category` on transactions). */
  fallback?: string;
  className?: string;
};

export default function EntityCategorySelect({ kind, entityId, fallback, className }: Props) {
  const { getOptionsForKind, getEntityCategory, setEntityCategory, entityHasCustomCategory } =
    useFinanceData();
  const hasAssignment = entityHasCustomCategory(kind, entityId);
  const display = getEntityCategory(kind, entityId, fallback);
  const opts = getOptionsForKind(kind);
  const mergedOpts = display && !opts.includes(display) ? [...opts, display] : opts;

  return (
    <select
      aria-label="Category"
      value={hasAssignment || fallback ? display : ''}
      onChange={(e) => setEntityCategory(kind, entityId, e.target.value)}
      className={
        className ??
        'min-w-[9rem] max-w-[16rem] text-sm bg-white/80 border border-ink-black/20 rounded-xl px-2 py-1.5'
      }
    >
      <option value="">{hasAssignment || fallback ? '—' : 'Select…'}</option>
      {mergedOpts.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}
