import { ShieldCheck, Users } from 'lucide-react';

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center shadow-sm shadow-emerald-600/30">
        <ShieldCheck className="w-5 h-5 text-white" strokeWidth={2.2} />
      </div>
      {!compact && (
        <div className="leading-tight">
          <span className="font-display font-bold text-lg text-stone-900 tracking-tight">
            LifeLoop <span className="text-emerald-600">AI</span>
          </span>
          <span className="hidden sm:flex items-center gap-1 text-[11px] text-stone-500 font-body">
            <Users className="w-3 h-3" /> Observe. Analyse. Improve.
          </span>
        </div>
      )}
    </div>
  );
}
