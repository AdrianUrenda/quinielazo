
-- Trigger: when a match's final scores change after first being set, re-evaluate
-- all predictions for that match so points_awarded stays consistent with the
-- actual outcome. Also notifies users whose points changed.

CREATE OR REPLACE FUNCTION public.rescore_predictions_on_match_score_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _scores_changed boolean;
BEGIN
  -- Only act when the final scores actually changed (not first fill, not unrelated update)
  _scores_changed :=
    (NEW.home_score IS NOT NULL AND NEW.away_score IS NOT NULL)
    AND OLD.home_score IS NOT NULL AND OLD.away_score IS NOT NULL
    AND (NEW.home_score IS DISTINCT FROM OLD.home_score
         OR NEW.away_score IS DISTINCT FROM OLD.away_score);

  IF NOT _scores_changed THEN
    RETURN NEW;
  END IF;

  -- Re-evaluate all predictions for this match in the public.predictions table
  UPDATE public.predictions p
  SET points_awarded = CASE
    WHEN p.predicted_home_score = NEW.home_score AND p.predicted_away_score = NEW.away_score THEN 3
    WHEN sign(p.predicted_home_score - p.predicted_away_score) = sign(NEW.home_score - NEW.away_score) THEN 1
    ELSE 0
  END
  WHERE p.match_id = NEW.id
    AND p.predicted_home_score IS NOT NULL
    AND p.predicted_away_score IS NOT NULL;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_rescore_predictions_on_match_score_change ON public.matches;
CREATE TRIGGER trg_rescore_predictions_on_match_score_change
AFTER UPDATE ON public.matches
FOR EACH ROW
EXECUTE FUNCTION public.rescore_predictions_on_match_score_change();
