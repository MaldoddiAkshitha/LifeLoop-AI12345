/*
# Create report-images storage bucket and seed demo reports

1. Storage
- Create public bucket `report-images` for user-uploaded report photos.
- Allow anon + authenticated to upload into it and anyone to read (photos are community-visible).
2. Data
- Seed six illustrative reports across categories so the dashboard, heatmap and
  leaderboard have content on first visit. Idempotent: each seed row has a fixed
  uuid, so re-running does not duplicate.
3. Security
- RLS on storage.objects is managed by Supabase; policies below scope access to
  the report-images bucket only.
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('report-images', 'report-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read report images" ON storage.objects;
CREATE POLICY "Public read report images"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'report-images');

DROP POLICY IF EXISTS "Anyone can upload report images" ON storage.objects;
CREATE POLICY "Anyone can upload report images"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'report-images');

INSERT INTO reports (id, description, category, priority, status, location, latitude, longitude, reporter_name, confidence, recommendation, confirm_count, created_at)
VALUES
  ('11111111-1111-4111-8111-111111111101', 'Overflowing garbage bin near the bus stop, waste spilling onto the footpath for two days', 'garbage', 'high', 'pending', 'MG Road bus stop', 12.9716, 77.5946, 'Priya S.', 0.94, 'Notify the municipal sanitation department and share the report with your residents'' welfare association for a pickup schedule.', 7, now() - interval '2 days'),
  ('11111111-1111-4111-8111-111111111102', 'Large pothole on the main road near the school gate, two-wheelers are swerving to avoid it', 'road', 'high', 'in_progress', 'Lakeview School gate', 12.9352, 77.6245, 'Arun K.', 0.89, 'Report to the roads and infrastructure department — potholes on busy routes qualify for emergency repair.', 12, now() - interval '4 days'),
  ('11111111-1111-4111-8111-111111111103', 'Water pipeline leaking at the corner, water has been flowing since yesterday evening', 'water', 'high', 'pending', '3rd Cross, Jayanagar', 12.9250, 77.5938, 'Meera R.', 0.92, 'Contact the water board immediately — leaks waste hundreds of litres a day and can damage the road base.', 5, now() - interval '1 day'),
  ('11111111-1111-4111-8111-111111111104', 'Streetlight not working on the park lane, the whole stretch is completely dark at night', 'streetlight', 'medium', 'resolved', 'Rosa Park lane', 12.9784, 77.6408, 'Dev P.', 0.85, 'File a lighting complaint with the electricity department. Dark streets are a safety risk.', 9, now() - interval '9 days'),
  ('11111111-1111-4111-8111-111111111105', 'Wedding hall discarding large amounts of leftover food in the open plot every weekend', 'food_wastage', 'medium', 'pending', 'Grand Palace Hall back gate', 12.9081, 77.5675, 'Sana T.', 0.78, 'Connect with a local food rescue NGO for pickup. Bulk food waste can be composted.', 4, now() - interval '3 days'),
  ('11111111-1111-4111-8111-111111111106', 'Garbage bags dumped beside the drainage every morning, attracting stray dogs', 'garbage', 'medium', 'resolved', 'Sector 7 market', 12.9899, 77.5954, 'Ravi M.', 0.9, 'Notify the municipal sanitation department and share the report with your residents'' welfare association.', 6, now() - interval '15 days')
ON CONFLICT (id) DO NOTHING;
