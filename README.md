# LifeLoop AI

**Observe. Analyse. Improve.**

LifeLoop AI is a community reporting app for local issues such as overflowing waste, water leaks, damaged roads, broken streetlights, and food wastage. Residents can submit a description, optionally add a photo and location, find similar reports, and follow community activity on a shared dashboard.

**Live app:** [life-loop-ai-12345.vercel.app](https://life-loop-ai-12345.vercel.app/)

## Features

- **Report a problem:** enter a description and name; photo and location are optional.
- **Text analysis:** estimates a category, priority, confidence, and next step.
- **Image estimate:** a lightweight color heuristic can suggest a category from an uploaded photo.
- **Duplicate matching:** compares a new description with recent reports in the same category and offers likely matches.
- **Community dashboard:** view report totals, status counts, a heatmap, and report cards.
- **Report actions:** confirm an existing report, change its status, or correct its category.
- **Impact and leaderboard:** see community impact scores and contributor points.
- **Voice input:** use browser speech recognition where supported.

## How analysis works

The form shows a local quick estimate while a description is being entered. On submission, the app calls the server endpoint `POST /api/analyze`, which sends the report text to Vercel AI Gateway using `openai/gpt-4.1-mini`.

If the Gateway is unavailable or not configured, the client falls back to the built-in keyword-based text analyzer. Reports can still be submitted. The photo classifier is a simple image-color heuristic; it is not a trained image-recognition model.

AI output is advisory. Review reports and recommendations before taking official action.

### Analyzer API

`POST /api/analyze`

Request:

```json
{
  "description": "A streetlight has been out near the park for two nights."
}
```

Successful response:

```json
{
  "category": "streetlight",
  "priority": "medium",
  "confidence": 0.82,
  "recommendation": "File a lighting complaint with the electricity department."
}
```

Categories: `garbage`, `road`, `water`, `streetlight`, `food_wastage`, `other`.

Priorities: `low`, `medium`, `high`.

Descriptions must be between 12 and 4,000 characters. The endpoint returns `400` for invalid input, `405` for methods other than POST, `503` when Gateway authentication is unavailable, and `502` when Gateway analysis fails.

## Tech stack

- React 18, TypeScript, and Vite
- Tailwind CSS
- Supabase JS for Postgres and Storage
- Vercel Functions and AI Gateway for cloud analysis
- Lucide React icons

## Local development

Requirements: Node.js and npm.

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env.local` file in the repository root:

   ```dotenv
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-publishable-or-anon-key
   ```

   Use the project API URL as the base URL; do not append `/rest/v1/`. The browser key must be a Supabase publishable key or legacy anon key. **Never use a Supabase service-role or secret key in a `VITE_` variable.**

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open the local URL printed by Vite.

Useful commands:

```bash
npm run build
npm run typecheck
npm run lint
npm run preview
```

## Supabase setup

The migrations in `supabase/migrations/` create the database objects used by the app:

- `20261121113747_create_reports_table.sql` — `public.reports`, row-level security, policies, and grants.
- `20261121114008_storage_bucket_and_seed.sql` — the `report-images` bucket and six demo reports.

Apply the migrations to the Supabase project before using the app. The frontend reads and writes report data using the publishable/anon key, so the table and Storage policies must match the intended public community workflow.

## Vercel deployment

The GitHub `main` branch is connected to the `life-loop-ai-12345` Vercel project. The production domain is [life-loop-ai-12345.vercel.app](https://life-loop-ai-12345.vercel.app/).

Set these project environment variables for **Production** (and Preview if preview deployments need database access):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

The app accepts the old misspelled names `VITE_SUPBASE_URL` and `VITE_SUPBASE_ANNON_KEY` as compatibility fallbacks, but new setups should use the correctly spelled names above. Vite variables are compiled into browser assets, so only put public client values in them.

Cloud AI uses Vercel OIDC on Vercel deployments. Alternatively, set `AI_GATEWAY_API_KEY` as a server-only Vercel environment variable. **Do not prefix this secret with `VITE_`, commit it, or expose it in browser code.** AI Gateway usage may require account verification and available credits; provider/model usage can incur charges under the team's billing settings. The local analyzer fallback keeps report submission available when cloud AI is unavailable.

After changing Vercel environment variables, create a new deployment so the build receives the updated values.

## Report data

The `public.reports` table contains report descriptions, category and priority estimates, status, optional location coordinates and image URL, reporter name, confidence, recommendation, confirmation count, and timestamps.

Available statuses are `pending`, `in_progress`, and `resolved`. The dashboard filters by status and category.

## Project structure

```text
api/
  analyze.ts                 # Server-side Vercel AI Gateway endpoint
src/
  App.tsx                    # App shell, data loading, submission flow, dashboard
  lib/
    ai.ts                    # Cloud call, local text and image analysis, duplicates
    supabase.ts              # Supabase client, report types, category labels
  components/
    ReportForm.tsx           # Report form, local estimate, upload, voice input
    ReportCard.tsx           # Individual report display and actions
    DuplicatePanel.tsx       # Duplicate-report review UI
    Heatmap.tsx              # Community problem heatmap
    ImpactScore.tsx          # Impact metrics
    Leaderboard.tsx          # Contributor ranking
    Badges.tsx                # Shared badge styles
    Logo.tsx                  # Brand mark
supabase/
  migrations/                 # Database schema, policies, storage, seed data
```

## Privacy and safety notes

- Report descriptions, reporter names, locations, and photo URLs are saved to Supabase when submitted.
- Text sent for cloud analysis is forwarded from the server to Vercel AI Gateway and the selected model provider.
- The Supabase browser key is intended for client-side use; database access must be protected by the configured row-level security policies.
- Analysis results are suggestions and may be incorrect.
