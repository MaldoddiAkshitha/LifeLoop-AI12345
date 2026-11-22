import { useCallback, useEffect, useMemo, useState } from 'react';
import { Megaphone, ScanSearch, LayoutDashboard, Trophy, Loader2 } from 'lucide-react';
import { supabase, type Report, type Category, type Priority } from './lib/supabase';
import { analyzeDescription, analyzeImage, analyzeReport, findDuplicates } from './lib/ai';
import { Logo } from './components/Logo';
import { ImpactScore } from './components/ImpactScore';
import { ReportCard } from './components/ReportCard';
import { Heatmap } from './components/Heatmap';
import { ReportForm, type Draft } from './components/ReportForm';
import { Leaderboard } from './components/Leaderboard';

type Tab = 'report' | 'dashboard' | 'impact';

const TABS: Array<{ id: Tab; label: string; icon: typeof Megaphone }> = [
  { id: 'report', label: 'Report', icon: Megaphone },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'impact', label: 'Impact', icon: Trophy },
];

export default function App() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('report');
  const [statusFilter, setStatusFilter] = useState<'all' | Report['status']>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | Category>('all');
  const [selectedPin, setSelectedPin] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      setLoadError('Could not load reports. Please try again.');
      return;
    }
    setLoadError(null);
    setReports((data ?? []) as Report[]);
  }, []);

  useEffect(() => {
    loadReports().finally(() => setLoading(false));
  }, [loadReports]);

  const confirmReport = useCallback(
    async (id: string) => {
      setConfirmingId(id);
      const current = reports.find((r) => r.id === id);
      if (!current) return;
      const { error } = await supabase
        .from('reports')
        .update({ confirm_count: current.confirm_count + 1 })
        .eq('id', id);
      if (error) {
        alert('Could not record your confirmation. Please try again.');
      } else {
        setReports((rs) =>
          rs.map((r) => (r.id === id ? { ...r, confirm_count: r.confirm_count + 1 } : r)),
        );
      }
      setConfirmingId(null);
    },
    [reports],
  );

  const changeStatus = useCallback(async (id: string, status: Report['status']) => {
    const { error } = await supabase.from('reports').update({ status }).eq('id', id);
    if (error) {
      alert('Could not update the status. Please try again.');
      return;
    }
    setReports((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
  }, []);

  const changeCategory = useCallback(async (id: string, category: Category) => {
    const { error } = await supabase.from('reports').update({ category }).eq('id', id);
    if (error) {
      alert('Could not update the category. Please try again.');
      return;
    }
    setReports((rs) => rs.map((r) => (r.id === id ? { ...r, category } : r)));
  }, []);

  const handleSubmit = useCallback(
    async (
      draft: Draft,
      onStage: (stage: 'analysing' | 'checking' | 'saving' | 'done') => void,
      ignoreDuplicates: boolean,
    ) => {
      onStage('analysing');
      await new Promise((r) => setTimeout(r, 700));

      const textAnalysis = await analyzeReport(draft.description);
      let category: Category = textAnalysis.category;
      let confidence = textAnalysis.confidence;

      if (draft.imageFile) {
        onStage('analysing');
        const imageResult = await analyzeImage(draft.imageFile);
        if (imageResult) {
          // Prefer the image signal when the text was inconclusive;
          // otherwise blend both signals.
          if (textAnalysis.category === 'other') {
            category = imageResult.category;
            confidence = imageResult.confidence;
          } else if (imageResult.category === textAnalysis.category) {
            confidence = Math.min(0.97, confidence + 0.06);
          }
        }
      }

      onStage('checking');
      await new Promise((r) => setTimeout(r, 500));

      const { data: existing, error: dupError } = await supabase
        .from('reports')
        .select('id, description, category, confirm_count')
        .eq('category', category)
        .order('created_at', { ascending: false })
        .limit(50);
      if (dupError) throw new Error('Could not check for similar reports.');

      const duplicates = findDuplicates(draft.description, category, existing ?? []).map((d) => ({
        report: d.report as Report,
        similarity: d.similarity,
      }));

      const submit = async (finalCategory: Category, finalPriority: Priority) => {
        onStage('saving');
        const { data, error } = await supabase
          .from('reports')
          .insert({
            description: draft.description,
            category: finalCategory,
            priority: finalPriority,
            location: draft.location || null,
            latitude: draft.latitude,
            longitude: draft.longitude,
            reporter_name: draft.reporterName,
            image_url: draft.imageUrl,
            confidence,
            recommendation: textAnalysis.recommendation,
          })
          .select()
          .single();
        if (error) throw new Error('Could not save your report. Please try again.');
        setReports((rs) => [data as Report, ...rs]);
        onStage('done');
      };

      if (duplicates.length > 0 && !ignoreDuplicates) {
        return {
          duplicates,
          confirmExisting: async (id: string) => {
            await confirmReport(id);
            onStage('done');
          },
        };
      }

      await submit(category, textAnalysis.priority);
      return { duplicates: [], confirmExisting: async () => {} };
    },
    [confirmReport],
  );

  const filtered = useMemo(
    () =>
      reports.filter(
        (r) =>
          (statusFilter === 'all' || r.status === statusFilter) &&
          (categoryFilter === 'all' || r.category === categoryFilter),
      ),
    [reports, statusFilter, categoryFilter],
  );

  const stats = useMemo(() => {
    const resolved = reports.filter((r) => r.status === 'resolved').length;
    const pending = reports.filter((r) => r.status === 'pending').length;
    const inProgress = reports.filter((r) => r.status === 'in_progress').length;
    return {
      total: reports.length,
      resolved,
      pending,
      inProgress,
      confirmations: reports.reduce((s, r) => s + r.confirm_count, 0),
    };
  }, [reports]);

  const leaderboard = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of reports) {
      map.set(r.reporter_name, (map.get(r.reporter_name) ?? 0) + 10 + r.confirm_count * 5 + (r.status === 'resolved' ? 15 : 0));
    }
    return Array.from(map.entries())
      .map(([name, points]) => ({ name, points }))
      .sort((a, b) => b.points - a.points)
      .slice(0, 8);
  }, [reports]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-6">
          <Logo />
          <nav className="flex items-center gap-1 ml-auto">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  tab === id
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-6 space-y-6">
        {loadError && (
          <div className="card border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center justify-between">
            <span>{loadError}</span>
            <button onClick={loadReports} className="font-semibold underline">Retry</button>
          </div>
        )}

        {loading ? (
          <div className="py-24 flex items-center justify-center text-stone-400">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : tab === 'report' ? (
          <div className="space-y-6">
            <Hero stats={stats} />
            <ReportForm onSubmit={handleSubmit} />
          </div>
        ) : tab === 'dashboard' ? (
          <div className="space-y-6">
            <ImpactScore
              total={stats.total}
              resolved={stats.resolved}
              pending={stats.pending + stats.inProgress}
              activeStreakWeeks={Math.max(1, Math.ceil(stats.total / 4))}
              goal={Math.max(10, Math.ceil(stats.total / 2) + 5)}
            />
            <div className="card p-4 space-y-4">
              <h2 className="font-display font-semibold text-stone-900 flex items-center gap-2">
                <ScanSearch className="w-5 h-5 text-emerald-600" /> Community Problem Heatmap
              </h2>
              <Heatmap reports={reports} selected={selectedPin} onSelect={setSelectedPin} />
            </div>
            <FilterBar
              statusFilter={statusFilter}
              categoryFilter={categoryFilter}
              onStatus={setStatusFilter}
              onCategory={setCategoryFilter}
              count={filtered.length}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              {filtered.map((r) => (
                <ReportCard
                  key={r.id}
                  report={r}
                  onConfirm={confirmReport}
                  onStatusChange={changeStatus}
                  onEditCategory={changeCategory}
                  confirming={confirmingId === r.id}
                />
              ))}
            </div>
            {filtered.length === 0 && (
              <div className="card p-10 text-center text-stone-400">
                No reports match these filters yet.
              </div>
            )}
          </div>
        ) : (
          <Leaderboard entries={leaderboard} stats={stats} />
        )}
      </main>

      <footer className="border-t border-stone-200 bg-white py-4">
        <p className="text-center text-xs text-stone-400">
          LifeLoop AI &mdash; AI predictions are suggestions, not verified facts. Review before official action.
        </p>
      </footer>
    </div>
  );
}

function Hero({ stats }: { stats: { total: number; resolved: number; confirmations: number } }) {
  return (
    <section className="rounded-2xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 text-white p-8 sm:p-10 relative overflow-hidden">
      <div className="absolute -right-10 -top-10 w-56 h-56 rounded-full bg-white/10" />
      <div className="absolute right-16 bottom-[-3rem] w-40 h-40 rounded-full bg-white/10" />
      <div className="relative max-w-2xl">
        <h1 className="font-display text-3xl sm:text-4xl font-bold leading-tight">
          Turn everyday problems into community action.
        </h1>
        <p className="mt-3 text-emerald-50/90 leading-relaxed">
          Snap a photo or describe the issue. Our AI identifies the category, suggests a priority,
          checks for duplicates and routes it to the community dashboard.
        </p>
        <div className="mt-5 flex gap-6 text-sm">
          <Metric value={stats.total} label="Reports" />
          <Metric value={stats.resolved} label="Resolved" />
          <Metric value={stats.confirmations} label="Confirmations" />
        </div>
      </div>
    </section>
  );
}

function Metric({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <div className="font-display text-2xl font-bold">{value}</div>
      <div className="text-emerald-100/80 text-xs uppercase tracking-wide">{label}</div>
    </div>
  );
}

function FilterBar({
  statusFilter,
  categoryFilter,
  onStatus,
  onCategory,
  count,
}: {
  statusFilter: 'all' | Report['status'];
  categoryFilter: 'all' | Category;
  onStatus: (s: 'all' | Report['status']) => void;
  onCategory: (c: 'all' | Category) => void;
  count: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <h2 className="font-display font-semibold text-stone-900 flex items-center gap-2 mr-auto">
        <LayoutDashboard className="w-5 h-5 text-emerald-600" />
        Live Reports <span className="text-sm font-normal text-stone-400">({count})</span>
      </h2>
      <select
        value={categoryFilter}
        onChange={(e) => onCategory(e.target.value as 'all' | Category)}
        className="text-sm rounded-lg border border-stone-200 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
      >
        <option value="all">All categories</option>
        <option value="garbage">Garbage / Waste</option>
        <option value="road">Damaged Road</option>
        <option value="water">Water Leakage</option>
        <option value="streetlight">Broken Streetlight</option>
        <option value="food_wastage">Food Wastage</option>
        <option value="other">Other</option>
      </select>
      <div className="flex rounded-lg border border-stone-200 bg-white overflow-hidden">
        {(['all', 'pending', 'in_progress', 'resolved'] as const).map((s) => (
          <button
            key={s}
            onClick={() => onStatus(s)}
            className={`px-3 py-2 text-sm font-medium transition-colors ${
              statusFilter === s ? 'bg-emerald-600 text-white' : 'text-stone-600 hover:bg-stone-50'
            }`}
          >
            {s === 'all' ? 'All' : s === 'in_progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}
