import { CheckCircle2, Sparkles } from 'lucide-react';
import { useFinanceData } from '../context/FinanceDataContext';

/**
 * Smart Categorizer: suggests categories for gaps only; user-set labels stay. Shown on the plugin page when enabled.
 */
export default function SmartCategorizeToolbar() {
  const {
    isPluginActive,
    runSmartCategorize,
    smartCategorizeBusy,
    smartCategorizeError,
    smartCategorizeSuccess,
  } = useFinanceData();
  if (!isPluginActive('expense_categorizer')) return null;

  return (
    <div className="flex flex-col gap-3 border-t border-ink-black/10 pt-6 mt-6">
      <div>
        <h3 className="text-sm font-bold tracking-widest uppercase text-ink-black/50 mb-1">
          Smart categorization
        </h3>
        <p className="text-sm text-ink-black/65 max-w-2xl">
          Suggests a category only where you haven&rsquo;t set one yet (including lines still blank or
          marked uncategorized). Categories you&rsquo;ve already chosen are never changed. This uses
          Google&rsquo;s AI; add your key to <code className="text-xs bg-ink-black/5 px-1">backend/.env</code> as{' '}
          <code className="text-xs bg-ink-black/5 px-1">GOOGLE_API_KEY</code> so the backend can run the
          request.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <button
          type="button"
          disabled={smartCategorizeBusy}
          onClick={() => void runSmartCategorize()}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-ink-black bg-ink-black text-canvas-cream px-4 py-2 text-sm font-medium hover:bg-ink-black/90 disabled:opacity-50 disabled:pointer-events-none w-fit"
        >
          <Sparkles size={16} />
          {smartCategorizeBusy ? 'Categorizing…' : 'Smart categorization'}
        </button>
        {smartCategorizeSuccess && !smartCategorizeBusy && (
          <p
            className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-800"
            role="status"
            aria-live="polite"
          >
            <CheckCircle2 size={16} className="shrink-0 text-emerald-600" strokeWidth={2.25} aria-hidden />
            {smartCategorizeSuccess}
          </p>
        )}
      </div>
      {smartCategorizeError && (
        <p
          className={
            smartCategorizeError.startsWith('Nothing to categorize right now')
              ? 'text-sm text-ink-black/70 max-w-xl'
              : 'text-sm text-signal-orange max-w-xl'
          }
          role="status"
        >
          {smartCategorizeError}
        </p>
      )}
    </div>
  );
}
