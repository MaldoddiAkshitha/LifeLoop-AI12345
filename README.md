# LifeLoop AI

**Observe. Analyse. Improve.**

LifeLoop AI is a community problem detection and management platform. Users report everyday
problems — overflowing garbage, water leakage, damaged roads, broken streetlights, food
wastage — with a photo, a description, or their voice. The app analyses the submission,
identifies the category, estimates urgency, checks for duplicate reports, and tracks
everything on a shared community dashboard.

## Features

- **AI image + text analysis** — photo color analysis and keyword-based text classification
  identify the problem category with a confidence score.
- **Priority prediction** — each report gets a low / medium / high priority suggestion,
  escalated when safety keywords are detected.
- **Duplicate intelligence** — similar existing reports are surfaced before saving, so
  five people reporting the same pothole strengthen one report instead of creating five.
- **Smart recommendations** — practical next steps per category (which department to call,
  what to include, who to loop in).
- **Live dashboard** — status and category filters, per-report confirmation counts, status
  tracking, and user-correction of AI predictions.
- **Community heatmap** — located reports appear as pins; size grows with confirmations,
  color flips when resolved.
- **Impact score & leaderboard** — Green Impact Points for reports, confirmations, and
  resolved issues.
- **Voice-to-report** — speech-to-text description input in supported browsers.

## Tech stack

- React 18 + TypeScript + Vite
- Tailwind CSS
- Supabase (Postgres database, storage for report photos, row-level security)
- Lucide React icons

## Getting started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Add a `.env` file with your Supabase project values:
   ```
   VITE_SUPABASE_URL=your-project-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

## Database

Schema lives in `supabase/migrations/`:

- `20261121113747_create_reports_table.sql` — the `reports` table, RLS policies, and grants.
- `20261121114008_storage_bucket_and_seed.sql` — the `report-images` storage bucket and
  six demo reports.

## Project structure

```
src/
  App.tsx                  # App shell, tabs, data loading, submit pipeline
  lib/
    supabase.ts            # Supabase client, types, label maps
    ai.ts                  # Text classification, image analysis, duplicate detection
  components/
    ReportForm.tsx         # Submission form with live AI preview and voice input
    ReportCard.tsx         # Individual report display and actions
    DuplicatePanel.tsx     # Duplicate-report matching UI
    Heatmap.tsx            # Location-based problem map
    ImpactScore.tsx        # Impact ring and stats
    Leaderboard.tsx        # Top contributors
    Badges.tsx             # Shared badge styles
    Logo.tsx               # Brand mark
```

## Note on AI predictions

AI predictions are suggestions, not verified facts. Users can correct the predicted
category on any report, and reports can be reviewed before any official action is taken.
