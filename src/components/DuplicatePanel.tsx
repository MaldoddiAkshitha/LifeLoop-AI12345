import { Link2, X, ThumbsUp } from 'lucide-react';
import { CATEGORY_LABELS, type Report } from '../lib/supabase';
import { CategoryIcon, CATEGORY_STYLES } from './Badges';

interface Props {
  duplicates: Array<{ report: Report; similarity: number }>;
  onConfirm: (id: string) => void;
  onDismiss: () => void;
  confirming?: boolean;
}

export function DuplicatePanel({ duplicates, onConfirm, onDismiss, confirming }: Props) {
  const totalConfirmed = duplicates.reduce((s, d) => s + d.report.confirm_count, 0);

  return (
    <div className="card border-amber-300 bg-amber-50 p-4 animate-fade-up">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Link2 className="w-5 h-5 text-amber-700" />
          <div>
            <h3 className="font-display font-semibold text-amber-900">Possible duplicates found</h3>
            <p className="text-xs text-amber-800">
              Similar reports already exist. Confirm an existing one instead &mdash; grouped reports carry more weight.
            </p>
          </div>
        </div>
        <button onClick={onDismiss} className="p-1 rounded-md text-amber-700 hover:bg-amber-100">
          <X className="w-4 h-4" />
        </button>
      </div>

      <ul className="space-y-2">
        {duplicates.map(({ report, similarity }) => (
          <li key={report.id} className="flex items-center gap-3 bg-white rounded-xl border border-amber-200 p-3">
            <span className={`w-8 h-8 rounded-lg border flex items-center justify-center ${CATEGORY_STYLES[report.category]}`}>
              <CategoryIcon category={report.category} className="w-4 h-4" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-stone-800 truncate">{report.description}</p>
              <p className="text-[11px] text-stone-500">
                {CATEGORY_LABELS[report.category]} &middot; {Math.round(similarity * 100)}% match &middot; {report.confirm_count} confirmations
              </p>
            </div>
            <button
              onClick={() => onConfirm(report.id)}
              disabled={confirming}
              className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              <ThumbsUp className="w-3.5 h-3.5" /> Confirm
            </button>
          </li>
        ))}
      </ul>

      {totalConfirmed > 0 && (
        <p className="text-[11px] text-amber-800 mt-2">
          Together these reports already carry {totalConfirmed} community confirmations.
        </p>
      )}
    </div>
  );
}
