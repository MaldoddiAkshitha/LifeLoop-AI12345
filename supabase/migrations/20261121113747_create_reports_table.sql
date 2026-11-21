/*
# Create reports table for LifeLoop AI (single-tenant, no auth)

1. New Tables
- `reports` — one row per community problem report
  - `id` (uuid, primary key, auto-generated)
  - `description` (text, not null) — user description of the problem
  - `category` (text, not null) — AI-predicted or user-corrected category (garbage, road, water, streetlight, food_wastage, other)
  - `priority` (text, not null) — low, medium, or high
  - `status` (text, not null, default 'pending') — pending, in_progress, or resolved
  - `location` (text) — free-text location / area name
  - `latitude` (double precision) — optional coordinates for the heatmap
  - `longitude` (double precision) — optional coordinates for the heatmap
  - `reporter_name` (text, not null) — display name shown on the dashboard
  - `image_url` (text) — optional uploaded photo
  - `confidence` (double precision) — AI confidence for the category prediction (0..1)
  - `recommendation` (text) — suggested next step for this report
  - `confirm_count` (integer, default 0) — number of people who confirmed this issue (duplicate intelligence)
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())
2. Security
- Enable RLS on `reports`.
- Grant SELECT, INSERT, UPDATE to `anon` and `authenticated` — the app is intentionally public/shared with no sign-in.
- Four separate CRUD-verb policies, `TO anon, authenticated`, using `(true)` because all report data is intentionally community-visible.
3. Indexes
- Index on `status` and `category` for dashboard filtering.
- Index on `created_at` for newest-first dashboard ordering.
*/

CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description text NOT NULL,
  category text NOT NULL,
  priority text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  location text,
  latitude double precision,
  longitude double precision,
  reporter_name text NOT NULL,
  image_url text,
  confidence double precision,
  recommendation text,
  confirm_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON reports TO anon, authenticated;

DROP POLICY IF EXISTS "Anyone can view reports" ON reports;
CREATE POLICY "Anyone can view reports"
ON reports FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Anyone can submit reports" ON reports;
CREATE POLICY "Anyone can submit reports"
ON reports FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update reports" ON reports;
CREATE POLICY "Anyone can update reports"
ON reports FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);
