ALTER TABLE public.demo_matches
ADD COLUMN IF NOT EXISTS round_label text,
ADD COLUMN IF NOT EXISTS round_order integer,
ADD COLUMN IF NOT EXISTS leg_label text,
ADD COLUMN IF NOT EXISTS status_detail text;

CREATE UNIQUE INDEX IF NOT EXISTS demo_matches_api_fixture_id_key
ON public.demo_matches (api_fixture_id)
WHERE api_fixture_id <> 0;