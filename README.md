# LifeLoop AI

**Observe. Analyse. Improve.**

LifeLoop AI is a community issue reporting app. Residents can report local problems, review possible duplicates, and follow community activity on a shared dashboard.

**Live app:** [life-loop-ai-12345.vercel.app](https://life-loop-ai-12345.vercel.app/)

## Features

- Submit issues with a description, optional photo, and optional location.
- Estimate category, priority, confidence, and a suggested next step.
- Find likely duplicate reports.
- View reports, status counts, and a community heatmap.
- Confirm reports, update statuses, and correct categories.
- Use impact scores, a leaderboard, and voice input where supported.
- Use Vercel AI Gateway analysis when available, with a local analyzer fallback.

## Documentation

See the [LifeLoop AI project documentation](docs/PROJECT_DOCUMENTATION.md) for setup, environment variables, database migrations, analyzer API, privacy notes, and Vercel deployment details.

## Quick start

```bash
npm install
npm run dev
```

Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.local` first. See the full documentation for setup details and security notes.
