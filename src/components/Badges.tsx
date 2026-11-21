import type { Category, Priority, Report } from '../lib/supabase';
import { PRIORITY_LABELS } from '../lib/supabase';
import {
  Trash2, Construction, Droplets, Lightbulb, Utensils, HelpCircle,
  AlertTriangle, AlertCircle, Minus,
} from 'lucide-react';

export function CategoryIcon({ category, className }: { category: Category; className?: string }) {
  const cls = className ?? 'w-4 h-4';
  switch (category) {
    case 'garbage': return <Trash2 className={cls} />;
    case 'road': return <Construction className={cls} />;
    case 'water': return <Droplets className={cls} />;
    case 'streetlight': return <Lightbulb className={cls} />;
    case 'food_wastage': return <Utensils className={cls} />;
    default: return <HelpCircle className={cls} />;
  }
}

export const CATEGORY_STYLES: Record<Category, string> = {
  garbage: 'bg-amber-100 text-amber-800 border-amber-200',
  road: 'bg-orange-100 text-orange-800 border-orange-200',
  water: 'bg-sky-100 text-sky-800 border-sky-200',
  streetlight: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  food_wastage: 'bg-lime-100 text-lime-800 border-lime-200',
  other: 'bg-stone-100 text-stone-700 border-stone-200',
};

export const STATUS_STYLES: Record<Report['status'], string> = {
  pending: 'bg-stone-100 text-stone-600 border-stone-200',
  in_progress: 'bg-blue-100 text-blue-700 border-blue-200',
  resolved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

export const STATUS_LABELS: Record<Report['status'], string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  resolved: 'Resolved',
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  const styles = {
    high: 'bg-red-100 text-red-700 border-red-200',
    medium: 'bg-amber-100 text-amber-700 border-amber-200',
    low: 'bg-stone-100 text-stone-500 border-stone-200',
  }[priority];
  const Icon = priority === 'high' ? AlertTriangle : priority === 'medium' ? AlertCircle : Minus;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-semibold ${styles}`}>
      <Icon className="w-3 h-3" />
      {PRIORITY_LABELS[priority]}
    </span>
  );
}

export function Badge({ children, className }: { children: React.ReactNode; className: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-semibold ${className}`}>
      {children}
    </span>
  );
}
