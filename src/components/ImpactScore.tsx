import { Users, CheckCircle2, Clock, Flame, Target } from 'lucide-react';

interface Props {
  total: number;
  resolved: number;
  pending: number;
  activeStreakWeeks: number;
  goal: number;
}

export function ImpactScore({ total, resolved, pending, activeStreakWeeks, goal }: Props) {
  const impact = total === 0 ? 0 : Math.round(((resolved * 10 + pending * 2) / Math.max(total * 10, 1)) * 100);
  const pct = Math.min(100, Math.round((impact / 100) * 100));
  const ring = Math.round((impact / 100) * 251);

  return (
    <div className="card p-5 flex flex-col sm:flex-row items-center gap-6">
      <div className="relative w-28 h-28 shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r="40" fill="none" stroke="#e7e5e4" strokeWidth="10" />
          <circle
            cx="50" cy="50" r="40" fill="none" stroke="#059669" strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${ring} 251`}
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-2xl font-bold text-stone-900">{pct}</span>
          <span className="text-[10px] uppercase tracking-wide text-stone-500">Impact</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 w-full">
        <Stat icon={Users} label="Total reports" value={total} tone="text-stone-800" />
        <Stat icon={CheckCircle2} label="Resolved" value={resolved} tone="text-emerald-600" />
        <Stat icon={Clock} label="Pending" value={pending} tone="text-amber-600" />
        <Stat icon={Flame} label="Weeks active" value={activeStreakWeeks} tone="text-orange-600" />
      </div>

      <div className="w-full sm:w-44">
        <div className="flex items-center gap-1.5 text-xs text-stone-600 mb-1.5">
          <Target className="w-3.5 h-3.5 text-emerald-600" />
          Community goal
        </div>
        <div className="h-2.5 rounded-full bg-stone-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-700"
            style={{ width: `${Math.min(100, (resolved / Math.max(goal, 1)) * 100)}%` }}
          />
        </div>
        <p className="text-[11px] text-stone-500 mt-1">{resolved} of {goal} issues resolved</p>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, tone }: { icon: typeof Users; label: string; value: number; tone: string }) {
  return (
    <div className="rounded-xl bg-stone-50 border border-stone-100 px-3 py-2.5">
      <div className={`flex items-center gap-1.5 text-xs ${tone}`}>
        <Icon className="w-3.5 h-3.5" /> {label}
      </div>
      <div className="font-display text-xl font-bold text-stone-900 mt-0.5">{value}</div>
    </div>
  );
}
