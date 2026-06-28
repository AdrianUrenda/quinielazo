-- 1. Relax protect_sealed_matches: allow first-time fills (OLD NULL -> NEW value),
--    keep blocking reverts/identity changes on already-set values.
CREATE OR REPLACE FUNCTION public.protect_sealed_matches()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _has_scored boolean;
  _is_sealed boolean;
  _allow text;
BEGIN
  _allow := current_setting('app.allow_match_mutation', true);
  IF _allow = 'on' THEN
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.predictions
    WHERE match_id = OLD.id AND COALESCE(points_awarded, 0) > 0
  ) INTO _has_scored;

  _is_sealed := (OLD.status = 'finished') OR _has_scored;

  IF NOT _is_sealed THEN
    RETURN NEW;
  END IF;

  -- Sealed rows: block only CHANGES to values that were already set.
  -- First-time fills (OLD IS NULL -> NEW set) are allowed so the sync worker
  -- can populate final scores on rows whose predictions were pre-scored.
  IF (OLD.stage IS NOT NULL AND NEW.stage IS DISTINCT FROM OLD.stage)
     OR (OLD.home_team IS NOT NULL AND NEW.home_team IS DISTINCT FROM OLD.home_team)
     OR (OLD.away_team IS NOT NULL AND NEW.away_team IS DISTINCT FROM OLD.away_team)
     OR (OLD.kickoff_utc IS NOT NULL AND NEW.kickoff_utc IS DISTINCT FROM OLD.kickoff_utc)
     OR (OLD.home_score IS NOT NULL AND NEW.home_score IS DISTINCT FROM OLD.home_score)
     OR (OLD.away_score IS NOT NULL AND NEW.away_score IS DISTINCT FROM OLD.away_score)
     OR (OLD.api_fixture_id IS NOT NULL AND NEW.api_fixture_id IS DISTINCT FROM OLD.api_fixture_id)
     OR (OLD.match_number IS NOT NULL AND NEW.match_number IS DISTINCT FROM OLD.match_number)
     OR (OLD.group_label IS NOT NULL AND NEW.group_label IS DISTINCT FROM OLD.group_label)
     OR (OLD.round_label IS NOT NULL AND NEW.round_label IS DISTINCT FROM OLD.round_label) THEN
    RAISE EXCEPTION 'Cannot modify sealed match % (status=%, has_scored=%). Set app.allow_match_mutation=on to override.',
      OLD.id, OLD.status, _has_scored
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$function$;

-- 2. Backfill the two group-stage matches whose scores never landed.
UPDATE public.matches
SET home_score = 3, away_score = 3, status = 'finished', status_detail = 'FT', last_synced_at = now()
WHERE id = '24901579-6ffc-4a5c-9508-64f9e990fc6c'
  AND home_score IS NULL;

UPDATE public.matches
SET home_score = 1, away_score = 3, status = 'finished', status_detail = 'FT', last_synced_at = now()
WHERE id = '13ae51d1-65cf-4d43-bc13-c3a9be8fcf81'
  AND home_score IS NULL;

-- 3. Remove duplicate Round-of-32 placeholders that share kickoff + stage with
--    a resolved fixture. Guardrails: only delete placeholders with no api_fixture_id,
--    no scores, and zero scored predictions, AND only when a real fixture
--    (api_fixture_id NOT NULL) already exists at the same slot.
DELETE FROM public.predictions p
WHERE p.match_id IN (
  SELECT ph.id
  FROM public.matches ph
  WHERE ph.stage = 'round_of_32'
    AND ph.api_fixture_id IS NULL
    AND ph.home_score IS NULL
    AND ph.away_score IS NULL
    AND ph.status = 'upcoming'
    AND NOT EXISTS (
      SELECT 1 FROM public.predictions sp
      WHERE sp.match_id = ph.id AND COALESCE(sp.points_awarded, 0) > 0
    )
    AND EXISTS (
      SELECT 1 FROM public.matches real
      WHERE real.stage = 'round_of_32'
        AND real.api_fixture_id IS NOT NULL
        AND real.kickoff_utc = ph.kickoff_utc
        AND real.id <> ph.id
    )
);

DELETE FROM public.matches ph
WHERE ph.stage = 'round_of_32'
  AND ph.api_fixture_id IS NULL
  AND ph.home_score IS NULL
  AND ph.away_score IS NULL
  AND ph.status = 'upcoming'
  AND NOT EXISTS (
    SELECT 1 FROM public.predictions sp
    WHERE sp.match_id = ph.id AND COALESCE(sp.points_awarded, 0) > 0
  )
  AND EXISTS (
    SELECT 1 FROM public.matches real
    WHERE real.stage = 'round_of_32'
      AND real.api_fixture_id IS NOT NULL
      AND real.kickoff_utc = ph.kickoff_utc
      AND real.id <> ph.id
  );