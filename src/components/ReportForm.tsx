import { useRef, useState } from 'react';
import {
  Camera, Upload, MapPin, Loader2, CheckCircle2, AlertTriangle, Sparkles, X, Mic,
} from 'lucide-react';
import { supabase, CATEGORY_LABELS, type Report } from '../lib/supabase';
import { analyzeDescription } from '../lib/ai';
import { DuplicatePanel } from './DuplicatePanel';

export interface Draft {
  description: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  reporterName: string;
  imageUrl: string | null;
  imageFile: File | null;
}

type Stage = 'idle' | 'analysing' | 'checking' | 'saving' | 'done';

const STORAGE_BUCKET = 'report-images';

interface Props {
  onSubmit: (
    draft: Draft,
    onStage: (stage: Stage) => void,
    ignoreDuplicates: boolean,
  ) => Promise<DuplicateResult>;
}

interface DuplicateResult {
  duplicates: Array<{ report: Report; similarity: number }>;
  confirmExisting: (id: string) => Promise<void>;
}

export function ReportForm({ onSubmit }: Props) {
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [name, setName] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>('idle');
  const [error, setError] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [dupes, setDupes] = useState<DuplicateResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const preview = description.trim().length > 12 ? analyzeDescription(description) : null;

  const onPickImage = (file: File | undefined) => {
    if (!file) return;
    setImageFile(file);
    setImageUrl(URL.createObjectURL(file));
  };

  const reset = () => {
    setDescription('');
    setLocation('');
    setImageFile(null);
    setImageUrl(null);
    setStage('idle');
    setDupes(null);
  };

  const useMyLocation = () => {
    if (!('geolocation' in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocation((l) => l || `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
      },
      () => setError('Location permission was denied. You can type the area name instead.'),
    );
  };

  const startVoice = () => {
    const SR = (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike; SpeechRecognition?: new () => SpeechRecognitionLike });
    const Ctor = SR.SpeechRecognition || SR.webkitSpeechRecognition;
    if (!Ctor) {
      setError('Voice input is not supported in this browser. Please type instead.');
      return;
    }
    const rec = new Ctor();
    rec.lang = 'en-IN';
    rec.onresult = (e: SpeechResultEvent) => {
      const text = Array.from(e.results).map((r: SpeechResult) => r[0].transcript).join(' ');
      setDescription((d) => (d ? `${d} ${text}` : text));
    };
    rec.onerror = () => setError('Could not hear anything. Please try again or type.');
    rec.start();
  };

  const submit = async (e: React.FormEvent, ignoreDuplicates = false) => {
    e?.preventDefault?.();
    setError(null);
    if (description.trim().length < 12) {
      setError('Please describe the problem in at least a few words.');
      return;
    }
    if (!name.trim()) {
      setError('Please add your name so the community knows who reported this.');
      return;
    }

    let uploadedUrl: string | null = null;
    if (imageFile) {
      setStage('saving');
      const path = `${Date.now()}-${imageFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const { error: upErr } = await supabase.storage.from(STORAGE_BUCKET).upload(path, imageFile);
      if (upErr) {
        // Bucket may not exist yet; keep the local preview so the report still saves.
        uploadedUrl = imageUrl;
      } else {
        const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
        uploadedUrl = data.publicUrl;
      }
    }

    try {
      const result = await onSubmit(
        {
          description: description.trim(),
          location: location.trim(),
          latitude: coords?.lat ?? null,
          longitude: coords?.lng ?? null,
          reporterName: name.trim(),
          imageUrl: uploadedUrl,
          imageFile,
        },
        setStage,
        ignoreDuplicates,
      );
      if (result.duplicates.length > 0) {
        setDupes(result);
        setStage('checking');
        return;
      }
      reset();
      setStage('done');
      setTimeout(() => setStage('idle'), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setStage('idle');
    }
  };

  const busy = stage === 'analysing' || stage === 'checking' || stage === 'saving';

  return (
    <form onSubmit={submit} className="card p-5 sm:p-6 space-y-4">
      <h2 className="font-display font-semibold text-lg text-stone-900 flex items-center gap-2">
        <Camera className="w-5 h-5 text-emerald-600" /> Report a problem
      </h2>

      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-sm font-medium text-stone-700">Describe the issue</label>
          <button
            type="button"
            onClick={startVoice}
            className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-800"
          >
            <Mic className="w-3.5 h-3.5" /> Voice input
          </button>
        </div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="e.g. Overflowing garbage bin near the bus stop, smelling bad for two days"
          className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 resize-none"
        />
        {preview && (
          <p className="mt-1.5 text-xs text-stone-500 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Quick estimate (AI verifies on submit): looks like <span className="font-semibold text-emerald-700">{CATEGORY_LABELS[preview.category]}</span>
            , suggested priority <span className="font-semibold">{preview.priority}</span>
          </p>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-stone-700 block mb-1.5">Photo (optional)</label>
          {imageUrl ? (
            <div className="relative rounded-xl overflow-hidden border border-stone-200 h-24">
              <img src={imageUrl} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => { setImageFile(null); setImageUrl(null); }}
                className="absolute top-1.5 right-1.5 p-1 rounded-full bg-white/90 text-stone-600 hover:bg-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full h-24 rounded-xl border-2 border-dashed border-stone-300 text-stone-500 hover:border-emerald-400 hover:text-emerald-600 flex flex-col items-center justify-center gap-1 text-sm transition-colors"
            >
              <Upload className="w-5 h-5" /> Upload a photo
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onPickImage(e.target.files?.[0])}
          />
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-stone-700 block mb-1.5">Location</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <MapPin className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Area, landmark or address"
                  className="w-full rounded-xl border border-stone-200 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>
              <button
                type="button"
                onClick={useMyLocation}
                title="Use my current location"
                className="px-3 rounded-xl border border-stone-200 text-stone-500 hover:border-emerald-400 hover:text-emerald-600 transition-colors"
              >
                <MapPin className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-stone-700 block mb-1.5">Your name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Shown on the community dashboard"
              className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>
        </div>
      </div>

      {dupes && (
        <DuplicatePanel
          duplicates={dupes.duplicates}
          confirming={busy}
          onConfirm={async (id) => {
            await dupes.confirmExisting(id);
            reset();
            setStage('done');
            setTimeout(() => setStage('idle'), 2500);
          }}
          onDismiss={() => {
            setDupes(null);
            void submit(new Event('submit') as unknown as React.FormEvent, true);
          }}
        />
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 disabled:opacity-60 transition-colors shadow-sm shadow-emerald-600/30"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          {stage === 'analysing' && 'AI analysing your report...'}
          {stage === 'checking' && 'Checking for duplicates...'}
          {stage === 'saving' && 'Saving report...'}
          {stage === 'done' && 'Report submitted!'}
          {stage === 'idle' && 'Submit report'}
        </button>
        {stage === 'done' && (
          <span className="text-sm text-emerald-700 font-medium animate-fade-up">
            Thank you! Your report is now on the community dashboard.
          </span>
        )}
      </div>
    </form>
  );
}

interface SpeechRecognitionLike {
  lang: string;
  onresult: (e: SpeechResultEvent) => void;
  onerror: () => void;
  start: () => void;
}

interface SpeechResult { 0: { transcript: string }; isFinal: boolean }
interface SpeechResultEvent { results: ArrayLike<SpeechResult> }
