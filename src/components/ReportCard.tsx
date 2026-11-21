import { MapPin, Clock, ThumbsUp, ImageOff, Sparkles, Pencil } from 'lucide-react';
import { CATEGORY_LABELS, type Report, type Category } from '../lib/supabase';
import { CategoryIcon, CATEGORY_STYLES, STATUS_STYLES, STATUS_LABELS, PriorityBadge, Badge } from './Badges';

interface Props {
  report: Report;
  onConfirm: (id: string) => void;
  onStatusChange: (id: string, status: Report['status']) => void;
  onEditCategory: (id: string, category: Category) => void;
  confirming?: boolean;
}

export function ReportCard({ report, onConfirm, onStatusChange, onEditCategory, confirming }: Props) {
  const time = new Date(report.created_at).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="card p-4 flex flex-col gap-3 hover:shadow-md transition-shadow animate-fade-up">
      {report.image_url ? (
        <div className="relative rounded-xl overflow-hidden h-40 bg-stone-100">
          <img src={report.image_url} alt="" className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="rounded-xl h-10 bg-stone-50 border border-stone-100 flex items-center gap-2 px-3 text-stone-400 text-xs">
          <ImageOff className="w-4 h-4" /> No photo attached
        </div>
      )}

      <div className="flex flex-wrap items-center gap-1.5">
        <Badge className={CATEGORY_STYLES[report.category]}>
          <CategoryIcon category={report.category} className="w-3 h-3" />
          {CATEGORY_LABELS[report.category]}
        </Badge>
        <PriorityBadge priority={report.priority} />
        <Badge className={STATUS_STYLES[report.status]}>{STATUS_LABELS[report.status]}</Badge>
        {report.confidence != null && (
          <Badge className="bg-violet-50 text-violet-700 border-violet-100">
            <Sparkles className="w-3 h-3" />
            {Math.round(report.confidence * 100)}% AI
          </Badge>
        )}
      </div>

      <p className="text-sm leading-relaxed text-stone-700 line-clamp-3">{report.description}</p>

      {report.recommendation && (
        <div className="flex gap-2 rounded-lg bg-emerald-50 border border-emerald-100 p-2.5 text-[12px] leading-relaxed text-emerald-900">
          <Sparkles className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
          <span>{report.recommendation}</span>
        </div>
      )}

      <div className="flex items-center gap-3 text-xs text-stone-500 mt-auto">
        <span className="flex items-center gap-1 font-medium text-stone-600">
          <MapPin className="w-3.5 h-3.5" /> {report.location || 'No location'}
        </span>
        <span className="flex items-center gap-1 ml-auto">
          <Clock className="w-3.5 h-3.5" /> {time}
        </span>
      </div>

      <div className="flex items-center gap-2 pt-1 border-t border-stone-100">
        <span className="text-xs text-stone-500 mr-auto">
          by <span className="font-medium text-stone-700">{report.reporter_name}</span>
        </span>

        <button
          onClick={() => onConfirm(report.id)}
          disabled={confirming}
          title="I see this problem too"
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-stone-100 text-stone-700 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-50 transition-colors"
        >
          <ThumbsUp className="w-3.5 h-3.5" /> Confirm ({report.confirm_count})
        </button>

        <select
          value={report.status}
          onChange={(e) => onStatusChange(report.id, e.target.value as Report['status'])}
          className="text-xs rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
        >
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>

        <label className="relative inline-flex items-center" title="Correct the AI category">
          <Pencil className="w-3.5 h-3.5 text-stone-400 absolute left-2 pointer-events-none" />
          <select
            value={report.category}
            onChange={(e) => onEditCategory(report.id, e.target.value as Category)}
            className="text-xs rounded-lg border border-stone-200 bg-white pl-7 pr-2 py-1.5 text-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          >
            {(Object.keys(CATEGORY_LABELS) as Category[]).map((c) => (
              <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
