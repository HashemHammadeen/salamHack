import { useFinanceData } from '../context/FinanceDataContext';
import EntityCategorySelect from './EntityCategorySelect';

/**
 * Stockholder list (names, category, share %). Shown on the Stockholders plugin page.
 */
export default function StockholdersPanel() {
  const { stockholders } = useFinanceData();

  return (
    <section>
      <div className="card overflow-x-auto">
        <table className="w-full text-left min-w-[480px]">
          <thead>
            <tr className="border-b border-ink-black/10">
              <th className="pb-4 font-medium">Name</th>
              <th className="pb-4 font-medium">Category</th>
              <th className="pb-4 font-medium">Email</th>
              <th className="pb-4 font-medium">Share %</th>
            </tr>
          </thead>
          <tbody>
            {stockholders.map(
              (s: { id: string; name: string; email: string; share_percent: number | null }) => (
                <tr key={s.id} className="border-b border-ink-black/5 last:border-0">
                  <td className="py-4 font-medium">{s.name}</td>
                  <td className="py-4 align-top">
                    <EntityCategorySelect kind="stockholder" entityId={s.id} />
                  </td>
                  <td className="py-4 text-sm text-ink-black/70">{s.email || '—'}</td>
                  <td className="py-4 tabular-nums">
                    {s.share_percent != null ? `${Number(s.share_percent).toFixed(1)}%` : '—'}
                  </td>
                </tr>
              )
            )}
            {stockholders.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-ink-black/60">
                  No stockholders in the database.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
