# LifeLoop AI — Project Documentation

## 1. Overview

LifeLoop AI is a community issue reporting and tracking app. Residents can report local problems, add a photo or location, review possible duplicates, and follow reports on a shared dashboard.

**Production app:** [https://life-loop-ai-12345.vercel.app](https://life-loop-ai-12345.vercel.app)

The app is built with React, TypeScript, and Vite. Supabase stores report data and uploaded photos. A Vercel Function connects report submission to Vercel AI Gateway when cloud analysis is available.

## 2. Main features

- Submit a report with a description and reporter name. Photo and location are optional.
- Estimate issue category, urgency, confidence, and a recommended next step.
- Compare a new report with recent reports in the same category and suggest likely duplicates.
- View totals, statuses, report cards, and a community problem heatmap.
- Confirm existing reports, change report status, and correct predicted categories.
- View impact metrics and contributor leaderboard.
- Enter a description with browser speech recognition where supported.

### Categories

- `garbage`
- `road`
- `water`
- `streetlight`
- `food_wastage`
- `other`

### Statuses

- `pending`
- `in_progress`
- `resolved`

## 3. Analysis behavior

### Text

The report form displays a local quick estimate as the user types. On submission, the app calls `POST /api/analyze`. That server-side endpoint sends the description to Vercel AI Gateway using `openai/gpt-4.1-mini`.

If cloud AI is unavailable, the client uses its built-in keyword-based analyzer so report submission can continue. The built-in analyzer assigns categories from report keywords, estimates priority from issue and safety terms, and provides category-specific guidance.

### Images

The image classifier samples image colors and brightness to produce a rough category estimate. This is a lightweight heuristic, not a trained vision model.

### Recommendations

The classifier may suggest actions such as contacting a municipal department. These are suggestions only. The app does not contact authorities or verify that a recommendation is appropriate for a specific location.

## 4. Analyzer API

### Request

`POST /api/analyze`

Content type: `application/json`

```json
{
  "description": "A streetlight has been out near the park for two nights."
}
```

Descriptions must contain between 12 and 4,000 characters.

### Successful response

```json
{
  "category": "streetlight",
  "priority": "medium",
  "confidence": 0.82,
  "recommendation": "File a lighting complaint with the electricity department."
}
```

### Error responses

- `400` — missing, invalid, or out-of-range description
- `405` — request method is not POST
- `503` — no AI Gateway authentication is available
- `502` — AI Gateway request failed or returned an unusable result

The browser client falls back to local text analysis if the API request fails.

## 5. Local setup

### Requirements

- Node.js
- npm
- A Supabase project with the app migrations applied

### Install

```bash
npm install
```

### Environment variables

Create `.env.local` in the repository root:

```dotenv
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-publishable-or-anon-key
```

Use the Supabase project API URL as the base URL. Do not append `/rest/v1/`.

The frontend key must be a Supabase publishable key or legacy anon key. Never put a Supabase service-role or secret key in a `VITE_` variable; Vite includes those values in browser code.

Start the development server:

```bash
npm run dev
```

Vite prints the local URL in the terminal.

### Available scripts

```bash
npm run dev        # Start Vite development server
npm run build      # Create the production build
npm run preview    # Preview the production build locally
npm run lint       # Run ESLint
npm run typecheck  # Run TypeScript checks
```

## 6. Supabase database and storage

The migrations in `supabase/migrations/` define the app data:

- `20261121113747_create_reports_table.sql` — creates `public.reports`, row-level security, policies, and grants.
- `20261121114008_storage_bucket_and_seed.sql` — creates the `report-images` Storage bucket and inserts six demo reports.

The reports table stores descriptions, category and priority, status, optional location coordinates and photo URL, reporter name, confidence, recommendation, confirmation count, and timestamps.

Apply both migrations to the Supabase project before using the application. Keep row-level security and Storage policies enabled for the public community workflow.

## 7. Vercel deployment

The GitHub `main` branch is connected to the Vercel project `life-loop-ai-12345`. Pushes to `main` trigger production deployments.

Configure these variables in the Vercel project for Production. Add them to Preview too if preview deployments should read/write app data:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

The app also recognizes the older misspelled names `VITE_SUPBASE_URL` and `VITE_SUPBASE_ANNON_KEY` for compatibility. Use the correctly spelled names in new configurations.

### AI Gateway authentication

Vercel deployments can use the Vercel OIDC token supplied to function requests. Alternatively, configure `AI_GATEWAY_API_KEY` as a server-only Vercel environment variable.

Do not prefix the AI Gateway key with `VITE_`, commit it, or expose it in client code. AI Gateway may require account verification and available credits; model usage can incur costs under the team's billing settings. If cloud analysis is unavailable, the app falls back to local analysis.

After changing Vercel environment variables, create a new deployment so Vite receives the updated build-time Supabase values.

## 8. Data flow

1. The browser reads and writes reports through Supabase using the public client key.
2. The browser sends report text to `/api/analyze` on submission.
3. The Vercel Function authenticates with Vercel OIDC or `AI_GATEWAY_API_KEY` and requests structured classification from AI Gateway.
4. If that request fails, the browser uses the local rule-based analyzer.
5. The app checks recent reports in the same category for duplicates, then saves the report to Supabase.

## 9. Privacy and safety

- Report descriptions, reporter names, locations, and photo URLs are stored in Supabase when submitted.
- When cloud analysis is available, report text is sent from the Vercel Function to Vercel AI Gateway and the selected model provider.
- Do not use service-role or secret Supabase keys in the browser.
- Treat predictions and recommendations as unverified suggestions.
- Review database row-level security and Storage policies before changing public access.

## 10. Repository layout

```text
api/
  analyze.ts                     # Vercel Function for cloud text analysis
src/
  App.tsx                        # App tabs, report loading, submission, dashboard
  lib/
    ai.ts                        # Cloud request, local analyzer, image heuristic, duplicates
    supabase.ts                  # Supabase client and report types
  components/
    ReportForm.tsx               # Submission form, quick estimate, photo, voice
    ReportCard.tsx               # Report card and actions
    DuplicatePanel.tsx            # Duplicate match review
    Heatmap.tsx                  # Community heatmap
    ImpactScore.tsx              # Impact metrics
    Leaderboard.tsx              # Contributor ranking
    Badges.tsx                   # Shared badge styles
    Logo.tsx                     # Brand mark
supabase/
  migrations/                    # Schema, security policies, Storage, seed data
