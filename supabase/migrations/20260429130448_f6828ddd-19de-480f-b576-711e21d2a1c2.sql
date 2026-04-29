ALTER TABLE public.matches
ADD COLUMN IF NOT EXISTS api_fixture_id integer,
ADD COLUMN IF NOT EXISTS home_team_logo text,
ADD COLUMN IF NOT EXISTS away_team_logo text,
ADD COLUMN IF NOT EXISTS round_label text,
ADD COLUMN IF NOT EXISTS status_detail text,
ADD COLUMN IF NOT EXISTS last_synced_at timestamp with time zone;

CREATE UNIQUE INDEX IF NOT EXISTS matches_api_fixture_id_key
ON public.matches (api_fixture_id)
WHERE api_fixture_id IS NOT NULL;