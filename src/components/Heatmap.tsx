import { MapPin } from 'lucide-react';
import type { Report } from '../lib/supabase';
import { CategoryIcon, CATEGORY_STYLES } from './Badges';

interface Props {
  reports: Report[];
  selected: string | null;
  onSelect: (id: string) => void;
}

export function Heatmap({ reports, selected, onSelect }: Props) {
  const located = reports.filter((r) => r.latitude != null && r.longitude != null);

  if (located.length === 0) {
    return (
      <div className="h-72 flex flex-col items-center justify-center gap-2 text-stone-400 bg-stone-50 rounded-xl border border-stone-100">
        <MapPin className="w-8 h-8" />
        <p className="text-sm">No located reports yet</p>
        <p className="text-xs text-stone-400">Add a location when reporting to populate the map</p>
      </div>
    );
  }

  return (
    <div className="relative h-72 rounded-xl overflow-hidden border border-stone-100 bg-[#eef3ec]">
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      {located.map((r) => {
        const left = ((r.longitude! + 180) / 360) * 100;
        const top = ((90 - r.latitude!) / 180) * 100;
        const size = 26 + Math.min(r.confirm_count, 10) * 4;
        const hot = r.status !== 'resolved';
        return (
          <button
            key={r.id}
            onClick={() => onSelect(r.id)}
            title={r.description}
            style={{ left: `${left}%`, top: `${top}%`, width: size, height: size }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center border transition-transform hover:scale-110 ${
              selected === r.id ? 'ring-2 ring-emerald-500 ring-offset-1 z-10' : ''
            } ${hot ? 'bg-red-500/25 border-red-400/60' : 'bg-emerald-500/25 border-emerald-400/60'}`}
          >
            <span className={`w-1/2 h-1/2 rounded-full ${hot ? 'bg-red-500' : 'bg-emerald-500'}`} />
          </button>
        );
      })}
      <div className="absolute bottom-2 left-2 flex gap-2 text-[10px] text-stone-600 bg-white/80 rounded-lg px-2 py-1">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Active</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Resolved</span>
        <span className="text-stone-400">Dot size = confirmations</span>
      </div>
      <div className="absolute top-2 right-2 flex -space-x-1.5">
        {located.slice(0, 4).map((r) => (
          <span key={r.id} className={`w-6 h-6 rounded-full border-2 border-white flex items-center justify-center ${CATEGORY_STYLES[r.category]}`}>
            <CategoryIcon category={r.category} className="w-3 h-3" />
          </span>
        ))}
      </div>
    </div>
  );
}
