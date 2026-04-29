WITH invalid_demo_matches AS (
  SELECT id
  FROM public.demo_matches
  WHERE kickoff_utc < TIMESTAMPTZ '2026-01-01 00:00:00+00'
     OR lower(coalesce(round_label, '')) LIKE '%play-in%'
     OR lower(coalesce(round_label, '')) LIKE '%play in%'
     OR lower(coalesce(round_label, '')) LIKE '%apertura%'
     OR lower(coalesce(round_label, '')) LIKE '%regular season%'
     OR lower(coalesce(round_label, '')) LIKE '%group stage%'
)
DELETE FROM public.demo_predictions dp
USING invalid_demo_matches invalid
WHERE dp.demo_match_id = invalid.id;

WITH invalid_demo_matches AS (
  SELECT id
  FROM public.demo_matches
  WHERE kickoff_utc < TIMESTAMPTZ '2026-01-01 00:00:00+00'
     OR lower(coalesce(round_label, '')) LIKE '%play-in%'
     OR lower(coalesce(round_label, '')) LIKE '%play in%'
     OR lower(coalesce(round_label, '')) LIKE '%apertura%'
     OR lower(coalesce(round_label, '')) LIKE '%regular season%'
     OR lower(coalesce(round_label, '')) LIKE '%group stage%'
)
DELETE FROM public.demo_matches dm
USING invalid_demo_matches invalid
WHERE dm.id = invalid.id;

UPDATE public.demo_matches
SET
  round_label = CASE
    WHEN lower(coalesce(round_label, '')) LIKE '%reclas%' OR lower(coalesce(round_label, '')) LIKE '%relegation round%' THEN 'Reclasificación'
    WHEN lower(coalesce(round_label, '')) LIKE '%quarter%' OR lower(coalesce(round_label, '')) LIKE '%cuarto%' THEN 'Cuartos de Final'
    WHEN lower(coalesce(round_label, '')) LIKE '%semi%' THEN 'Semifinales'
    WHEN lower(coalesce(round_label, '')) LIKE '%final%' THEN 'Final'
    ELSE round_label
  END,
  round_order = CASE
    WHEN lower(coalesce(round_label, '')) LIKE '%reclas%' OR lower(coalesce(round_label, '')) LIKE '%relegation round%' THEN 0
    WHEN lower(coalesce(round_label, '')) LIKE '%quarter%' OR lower(coalesce(round_label, '')) LIKE '%cuarto%' THEN 1
    WHEN lower(coalesce(round_label, '')) LIKE '%semi%' THEN 2
    WHEN lower(coalesce(round_label, '')) LIKE '%final%' THEN 3
    ELSE round_order
  END,
  home_score = CASE WHEN kickoff_utc >= TIMESTAMPTZ '2026-01-01 00:00:00+00' THEN home_score ELSE NULL END,
  away_score = CASE WHEN kickoff_utc >= TIMESTAMPTZ '2026-01-01 00:00:00+00' THEN away_score ELSE NULL END
WHERE kickoff_utc >= TIMESTAMPTZ '2026-01-01 00:00:00+00';