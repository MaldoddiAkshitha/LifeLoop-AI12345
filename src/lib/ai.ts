import type { Category, Priority } from './supabase';

interface AnalysisResult {
  category: Category;
  priority: Priority;
  confidence: number;
  recommendation: string;
}

interface Rule {
  category: Category;
  keywords: string[];
  basePriority: Priority;
  recommendation: string;
}

const RULES: Rule[] = [
  {
    category: 'garbage',
    keywords: [
      'garbage', 'trash', 'waste', 'bin', 'dump', 'litter', 'rubbish',
      'overflow', 'debris', 'smell', 'stink', 'sewage solid',
    ],
    basePriority: 'medium',
    recommendation:
      'Notify the municipal sanitation department and share the report with your residents\u2019 welfare association for a pickup schedule.',
  },
  {
    category: 'road',
    keywords: [
      'pothole', 'road', 'crack', 'asphalt', 'sinkhole', 'broken road',
      'damaged road', 'speed bump', 'manhole', 'divider',
    ],
    basePriority: 'high',
    recommendation:
      'Report to the roads and infrastructure department \u2014 potholes on busy routes qualify for emergency repair. Add a photo of the road for the survey team.',
  },
  {
    category: 'water',
    keywords: [
      'leak', 'water', 'pipe', 'burst', 'flood', 'drainage', 'pipeline',
      'waterlog', 'tap', 'overflowing water', 'sewage',
    ],
    basePriority: 'high',
    recommendation:
      'Contact the water board immediately \u2014 leaks waste hundreds of litres a day and can damage the road base. Mark the exact leak spot if possible.',
  },
  {
    category: 'streetlight',
    keywords: [
      'streetlight', 'street light', 'lamp', 'light', 'dark', 'bulb',
      'pole', 'lighting', 'not working light', 'electric',
    ],
    basePriority: 'medium',
    recommendation:
      'File a lighting complaint with the electricity department. Dark streets are a safety risk \u2014 mention if the stretch is near a school or main road.',
  },
  {
    category: 'food_wastage',
    keywords: [
      'food', 'leftover', 'restaurant', 'wasted food', 'food waste',
      'banquet', 'canteen', 'expired', 'rotten',
    ],
    basePriority: 'medium',
    recommendation:
      'Connect with a local food rescue NGO for pickup. Bulk food waste can be composted \u2014 suggest the community composting hub if nearby.',
  },
];

const DANGER_WORDS = ['accident', 'injur', 'danger', 'emergency', 'unsafe', 'collapse', 'spark', 'fire', 'shock'];
const QUALIFIER_WORDS = ['minor', 'small', 'slight', 'tiny', 'little', 'near'];

export async function analyzeReport(description: string): Promise<AnalysisResult> {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description }),
  });

  if (!response.ok) {
    let message = 'AI analysis is temporarily unavailable. Please try again.';
    try {
      const body = (await response.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      // Keep the safe fallback message when the server response is not JSON.
    }
    throw new Error(message);
  }

  return (await response.json()) as AnalysisResult;
}

export function analyzeDescription(description: string): AnalysisResult {
  const text = description.toLowerCase();

  let best: { rule: Rule; score: number } | null = null;
  for (const rule of RULES) {
    let score = 0;
    for (const kw of rule.keywords) {
      if (text.includes(kw)) score += kw.length > 6 ? 2 : 1;
    }
    if (score > (best?.score ?? 0)) best = { rule, score };
  }

  const category = best?.rule.category ?? 'other';
  let priority: Priority = best?.rule.basePriority ?? 'medium';
  let confidence = best ? Math.min(0.68 + best.score * 0.08, 0.96) : 0.52;

  if (DANGER_WORDS.some((w) => text.includes(w))) {
    priority = 'high';
    confidence = Math.min(confidence + 0.05, 0.97);
  } else if (QUALIFIER_WORDS.some((w) => text.includes(w)) && priority === 'high') {
    priority = 'medium';
  }

  const recommendation =
    best?.rule.recommendation ??
    'A community moderator will review this report and route it to the right department. Adding a photo and location helps speed this up.';

  return { category, priority, confidence, recommendation };
}

// Lightweight image heuristics: derive signal from the photo's properties
// when a real classifier is not available. Color statistics of the image
// give a crude but real "visual analysis" for the demo.
export async function analyzeImage(file: File): Promise<{ category: Category; confidence: number } | null> {
  try {
    const bitmap = await createImageBitmap(file);
    const size = 48;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(bitmap, 0, 0, size, size);
    const { data } = ctx.getImageData(0, 0, size, size);

    let brownish = 0;
    let grayish = 0;
    let bluish = 0;
    let greenish = 0;
    let dark = 0;
    const total = size * size;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const brightness = (r + g + b) / 3;
      if (brightness < 60) dark++;
      if (r > 90 && r > g + 15 && g > b + 10) brownish++;
      else if (Math.abs(r - g) < 18 && Math.abs(g - b) < 18) grayish++;
      else if (b > r + 15 && b > g) bluish++;
      else if (g > r + 10 && g > b + 10) greenish++;
    }

    const candidates: Array<{ category: Category; score: number }> = [
      { category: 'garbage', score: brownish / total },
      { category: 'road', score: grayish / total },
      { category: 'water', score: bluish / total },
      { category: 'food_wastage', score: (brownish + greenish) / (2 * total) },
    ];

    const darkness = dark / total;
    if (darkness > 0.55) {
      candidates.push({ category: 'streetlight', score: darkness });
    }

    candidates.sort((a, b) => b.score - a.score);
    const top = candidates[0];
    if (!top || top.score < 0.15) return null;

    // Map the visual score to a plausible confidence range
    const confidence = Math.min(0.6 + top.score * 0.5, 0.9);
    return { category: top.category, confidence };
  } catch {
    return null;
  }
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3);
}

export function jaccardSimilarity(a: string, b: string): number {
  const sa = new Set(tokenize(a));
  const sb = new Set(tokenize(b));
  if (sa.size === 0 || sb.size === 0) return 0;
  let intersection = 0;
  for (const w of sa) if (sb.has(w)) intersection++;
  return intersection / (sa.size + sb.size - intersection);
}

export interface DuplicateCandidate {
  report: { id: string; description: string; category: string; confirm_count: number };
  similarity: number;
}

export function findDuplicates(
  description: string,
  category: Category,
  existing: Array<{ id: string; description: string; category: string; confirm_count: number }>,
): DuplicateCandidate[] {
  return existing
    .filter((r) => r.category === category)
    .map((r) => ({ report: r, similarity: jaccardSimilarity(description, r.description) }))
    .filter((d) => d.similarity >= 0.34)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 3);
}
