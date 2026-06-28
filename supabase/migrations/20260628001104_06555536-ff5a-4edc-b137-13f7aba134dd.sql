
-- ============================================================
-- LAYER 2: Database-level guardrails (defense in depth)
-- ============================================================

-- Guard 1: Block destructive UPDATEs on matches that are finished
-- or that already have scored predictions. Only cosmetic fields
-- (status_detail, last_synced_at, logos) can change after that point.
CREATE OR REPLACE FUNCTION public.protect_sealed_matches()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  -- Sealed: only allow cosmetic columns to change.
  IF NEW.stage IS DISTINCT FROM OLD.stage
     OR NEW.home_team IS DISTINCT FROM OLD.home_team
     OR NEW.away_team IS DISTINCT FROM OLD.away_team
     OR NEW.kickoff_utc IS DISTINCT FROM OLD.kickoff_utc
     OR NEW.home_score IS DISTINCT FROM OLD.home_score
     OR NEW.away_score IS DISTINCT FROM OLD.away_score
     OR NEW.api_fixture_id IS DISTINCT FROM OLD.api_fixture_id
     OR NEW.match_number IS DISTINCT FROM OLD.match_number
     OR NEW.group_label IS DISTINCT FROM OLD.group_label
     OR NEW.round_label IS DISTINCT FROM OLD.round_label THEN
    RAISE EXCEPTION 'Cannot modify sealed match % (status=%, has_scored=%). Set app.allow_match_mutation=on to override.',
      OLD.id, OLD.status, _has_scored
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_sealed_matches ON public.matches;
CREATE TRIGGER trg_protect_sealed_matches
  BEFORE UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.protect_sealed_matches();

-- Guard 2: Block DELETE on matches that have any scored predictions.
CREATE OR REPLACE FUNCTION public.protect_scored_match_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _allow text;
  _has_scored boolean;
BEGIN
  _allow := current_setting('app.allow_match_mutation', true);
  IF _allow = 'on' THEN
    RETURN OLD;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.predictions
    WHERE match_id = OLD.id AND COALESCE(points_awarded, 0) > 0
  ) INTO _has_scored;

  IF _has_scored THEN
    RAISE EXCEPTION 'Cannot delete match % — it has scored predictions. Set app.allow_match_mutation=on to override.', OLD.id
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_scored_match_delete ON public.matches;
CREATE TRIGGER trg_protect_scored_match_delete
  BEFORE DELETE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.protect_scored_match_delete();

-- Guard 3: Block DELETE on predictions that already earned points,
-- unless a legitimate recovery script sets the override flag.
CREATE OR REPLACE FUNCTION public.protect_scored_prediction_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _allow text;
BEGIN
  _allow := current_setting('app.allow_scored_delete', true);
  IF _allow = 'on' THEN
    RETURN OLD;
  END IF;

  IF COALESCE(OLD.points_awarded, 0) > 0 THEN
    RAISE EXCEPTION 'Cannot delete prediction % — it has points_awarded=%. Set app.allow_scored_delete=on to override.',
      OLD.id, OLD.points_awarded
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_scored_prediction_delete ON public.predictions;
CREATE TRIGGER trg_protect_scored_prediction_delete
  BEFORE DELETE ON public.predictions
  FOR EACH ROW EXECUTE FUNCTION public.protect_scored_prediction_delete();

-- ============================================================
-- LAYER 3: Append-only archive snapshots
-- ============================================================

CREATE TABLE IF NOT EXISTS public.matches_archive (
  archive_id BIGSERIAL PRIMARY KEY,
  snapshot_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  id UUID NOT NULL,
  api_fixture_id BIGINT,
  match_number INTEGER,
  stage TEXT,
  group_label TEXT,
  round_label TEXT,
  home_team TEXT,
  away_team TEXT,
  kickoff_utc TIMESTAMPTZ,
  status TEXT,
  status_detail TEXT,
  home_score INTEGER,
  away_score INTEGER,
  payload JSONB NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_matches_archive_id ON public.matches_archive(id);
CREATE INDEX IF NOT EXISTS idx_matches_archive_snapshot_at ON public.matches_archive(snapshot_at);

GRANT SELECT ON public.matches_archive TO authenticated;
GRANT ALL ON public.matches_archive TO service_role;
ALTER TABLE public.matches_archive ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only admins can read matches_archive"
  ON public.matches_archive FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TABLE IF NOT EXISTS public.predictions_archive (
  archive_id BIGSERIAL PRIMARY KEY,
  snapshot_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  id UUID NOT NULL,
  user_id UUID NOT NULL,
  group_id UUID,
  match_id UUID NOT NULL,
  predicted_home_score INTEGER,
  predicted_away_score INTEGER,
  points_awarded INTEGER,
  payload JSONB NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_predictions_archive_id ON public.predictions_archive(id);
CREATE INDEX IF NOT EXISTS idx_predictions_archive_user ON public.predictions_archive(user_id);
CREATE INDEX IF NOT EXISTS idx_predictions_archive_match ON public.predictions_archive(match_id);
CREATE INDEX IF NOT EXISTS idx_predictions_archive_snapshot_at ON public.predictions_archive(snapshot_at);

GRANT SELECT ON public.predictions_archive TO authenticated;
GRANT ALL ON public.predictions_archive TO service_role;
ALTER TABLE public.predictions_archive ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only admins can read predictions_archive"
  ON public.predictions_archive FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Snapshot function: copy current state of matches + predictions
-- into the archive tables. Idempotent per call (each call inserts
-- a new snapshot row set with the same snapshot_at).
CREATE OR REPLACE FUNCTION public.snapshot_matches_and_predictions()
RETURNS TABLE (matches_snapshotted INTEGER, predictions_snapshotted INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _ts TIMESTAMPTZ := now();
  _m INTEGER;
  _p INTEGER;
BEGIN
  INSERT INTO public.matches_archive (
    snapshot_at, id, api_fixture_id, match_number, stage, group_label,
    round_label, home_team, away_team, kickoff_utc, status, status_detail,
    home_score, away_score, payload
  )
  SELECT _ts, m.id, m.api_fixture_id, m.match_number, m.stage, m.group_label,
         m.round_label, m.home_team, m.away_team, m.kickoff_utc, m.status, m.status_detail,
         m.home_score, m.away_score, to_jsonb(m)
  FROM public.matches m;
  GET DIAGNOSTICS _m = ROW_COUNT;

  INSERT INTO public.predictions_archive (
    snapshot_at, id, user_id, group_id, match_id,
    predicted_home_score, predicted_away_score, points_awarded, payload
  )
  SELECT _ts, p.id, p.user_id, p.group_id, p.match_id,
         p.predicted_home_score, p.predicted_away_score, p.points_awarded, to_jsonb(p)
  FROM public.predictions p;
  GET DIAGNOSTICS _p = ROW_COUNT;

  RETURN QUERY SELECT _m, _p;
END;
$$;

REVOKE ALL ON FUNCTION public.snapshot_matches_and_predictions() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.snapshot_matches_and_predictions() TO service_role;

-- Schedule a daily snapshot at 07:00 UTC (01:00 CDMX). Uses pg_cron + the
-- service role via SECURITY DEFINER so no external invocation is needed.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('daily-matches-predictions-snapshot')
      WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-matches-predictions-snapshot');
    PERFORM cron.schedule(
      'daily-matches-predictions-snapshot',
      '0 7 * * *',
      $cron$ SELECT public.snapshot_matches_and_predictions(); $cron$
    );
  END IF;
END
$$;
