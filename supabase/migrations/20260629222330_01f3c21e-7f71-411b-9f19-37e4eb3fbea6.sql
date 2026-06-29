CREATE OR REPLACE FUNCTION public.protect_scored_prediction_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _allow text;
BEGIN
  -- Hard guard: block ALL prediction deletions unless an explicit override
  -- is set on the session. This protects unscored predictions too (e.g.
  -- knockout rounds where points haven't been awarded yet).
  _allow := current_setting('app.allow_prediction_delete', true);
  IF _allow = 'on' THEN
    RETURN OLD;
  END IF;

  -- Backwards-compat: also accept the legacy override name.
  _allow := current_setting('app.allow_scored_delete', true);
  IF _allow = 'on' THEN
    RETURN OLD;
  END IF;

  RAISE EXCEPTION 'Prediction % cannot be deleted (user=%, match=%, points=%). Set app.allow_prediction_delete=on to override.',
    OLD.id, OLD.user_id, OLD.match_id, COALESCE(OLD.points_awarded, 0)
    USING ERRCODE = 'check_violation';
END;
$function$;

-- Ensure trigger exists on the predictions table (idempotent)
DROP TRIGGER IF EXISTS protect_predictions_delete ON public.predictions;
CREATE TRIGGER protect_predictions_delete
  BEFORE DELETE ON public.predictions
  FOR EACH ROW EXECUTE FUNCTION public.protect_scored_prediction_delete();