WITH invalid_demo_matches AS (
  SELECT id
  FROM public.demo_matches
  WHERE round_label IS NULL
     OR jornada IS NULL
     OR jornada < 900
)
DELETE FROM public.demo_predictions dp
USING invalid_demo_matches invalid
WHERE dp.demo_match_id = invalid.id;

WITH invalid_demo_matches AS (
  SELECT id
  FROM public.demo_matches
  WHERE round_label IS NULL
     OR jornada IS NULL
     OR jornada < 900
)
DELETE FROM public.demo_matches dm
USING invalid_demo_matches invalid
WHERE dm.id = invalid.id;