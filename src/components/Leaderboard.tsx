import { Trophy, Medal, Award, Sparkles, CheckCircle2, Users } from 'lucide-react';

interface Props {
  entries: Array<{ name: string; points: number }>;
  stats: { total: number; resolved: number; confirmations: number };
}

export function Leaderboard({ entries, stats }: Props) {
  const medals = [Trophy, Medal, Award];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 text-white p-8 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-56 h-56 rounded-full bg-white/10" />
        <div className="relative">
          <h1 className="font-display text-3xl font-bold">Community Impact</h1>
          <p className="mt-2 text-emerald-50/90 max-w-xl">
            Green Impact Points reward verified, helpful contributions. Every confirmed report
            strengthens the case for fixing it.
          </p>
          <div className="mt-5 flex gap-6 text-sm">
            <Metric icon={Users} value={stats.total} label="Reports" />
            <Metric icon={CheckCircle2} value={stats.resolved} label="Resolved" />
            <Metric icon={Sparkles} value={stats.confirmations} label="Confirmations" />
          </div>
        </div>
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="font-display font-semibold text-lg text-stone-900 flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-emerald-600" /> Top contributors
        </h2>
        {entries.length === 0 ? (
          <p className="text-sm text-stone-400 py-6 text-center">
            No contributions yet. Be the first to report a problem.
          </p>
        ) : (
          <ol className="space-y-2">
            {entries.map((e, i) => {
              const Icon = medals[i] ?? null;
              return (
                <li
                  key={e.name}
                  className={`flex items-center gap-3 rounded-xl border p-3 animate-fade-up ${
                    i < 3 ? 'bg-emerald-50/60 border-emerald-200' : 'bg-white border-stone-200'
                  }`}
                >
                  <span className={`w-9 h-9 rounded-full flex items-center justify-center font-display font-bold text-sm ${
                    i < 3 ? 'bg-emerald-600 text-white' : 'bg-stone-100 text-stone-500'
                  }`}>
                    {i < 3 && Icon ? <Icon className="w-4 h-4" /> : i + 1}
                  </span>
                  <span className="font-medium text-stone-800 flex-1">{e.name}</span>
                  <span className="font-display font-bold text-emerald-700">{e.points} pts</span>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </div>
  );
}

function Metric({ icon: Icon, value, label }: { icon: typeof Users; value: number; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-5 h-5 text-emerald-100" />
      <div>
        <div className="font-display text-xl font-bold">{value}</div>
        <div className="text-emerald-100/80 text-xs uppercase tracking-wide">{label}</div>
      </div>
    </div>
  );
}
