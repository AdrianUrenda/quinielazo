
-- 1) Backfill the South Africa vs Canada final score and mark as finished
SET LOCAL app.allow_match_mutation = 'on';
UPDATE public.matches
SET home_score = 0, away_score = 1, status = 'finished', status_detail = 'FT'
WHERE id = '4a3817a6-d5cc-4154-8c61-9efd2b62eea9';

-- 2) Fix already-sent notifications text
UPDATE public.notifications
SET message = REPLACE(message, 'South Africa ?-? Canada', 'South Africa 0-1 Canada')
WHERE message LIKE '%South Africa ?-? Canada%';

-- 3) Harden notify_prediction_points: skip notification when scores still NULL.
--    A companion trigger on matches re-emits notifications once scores are filled.
CREATE OR REPLACE FUNCTION public.notify_prediction_points()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _home_team text;
  _away_team text;
  _home_score int;
  _away_score int;
  _group_name text;
  _msg text;
BEGIN
  IF (NEW.points_awarded IS NOT NULL AND NEW.points_awarded > 0)
     AND (OLD.points_awarded IS NULL OR OLD.points_awarded = 0) THEN

    SELECT m.home_team, m.away_team, m.home_score, m.away_score
    INTO _home_team, _away_team, _home_score, _away_score
    FROM matches m WHERE m.id = NEW.match_id;

    -- Defer: a trigger on matches will emit once final scores exist.
    IF _home_score IS NULL OR _away_score IS NULL THEN
      RETURN NEW;
    END IF;

    SELECT g.name INTO _group_name FROM groups g WHERE g.id = NEW.group_id;
    _home_team := COALESCE(_home_team, 'Local');
    _away_team := COALESCE(_away_team, 'Visitante');
    _group_name := COALESCE(_group_name, 'tu grupo');

    IF NEW.points_awarded = 3 THEN
      _msg := '🎯 ¡Marcador exacto! Ganaste 3 puntos en ' || _group_name || ' — ' || _home_team || ' ' || _home_score || '-' || _away_score || ' ' || _away_team;
    ELSE
      _msg := '✅ ¡Resultado correcto! Ganaste 1 punto en ' || _group_name || ' — ' || _home_team || ' ' || _home_score || '-' || _away_score || ' ' || _away_team;
    END IF;

    INSERT INTO notifications (user_id, type, message, metadata)
    VALUES (NEW.user_id, 'match_scored', _msg, jsonb_build_object('group_id', NEW.group_id, 'match_id', NEW.match_id));
  END IF;

  RETURN NEW;
END;
$function$;

-- 4) When a match transitions to having final scores, emit any pending
--    point notifications for predictions that were scored before scores arrived.
CREATE OR REPLACE FUNCTION public.notify_pending_points_on_match_score()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _scores_just_arrived boolean;
BEGIN
  _scores_just_arrived :=
    (NEW.home_score IS NOT NULL AND NEW.away_score IS NOT NULL)
    AND (OLD.home_score IS NULL OR OLD.away_score IS NULL);

  IF NOT _scores_just_arrived THEN
    RETURN NEW;
  END IF;

  INSERT INTO notifications (user_id, type, message, metadata)
  SELECT
    p.user_id,
    'match_scored',
    CASE WHEN p.points_awarded = 3
      THEN '🎯 ¡Marcador exacto! Ganaste 3 puntos en ' || COALESCE(g.name, 'tu grupo') || ' — ' || COALESCE(NEW.home_team, 'Local') || ' ' || NEW.home_score || '-' || NEW.away_score || ' ' || COALESCE(NEW.away_team, 'Visitante')
      ELSE '✅ ¡Resultado correcto! Ganaste 1 punto en ' || COALESCE(g.name, 'tu grupo') || ' — ' || COALESCE(NEW.home_team, 'Local') || ' ' || NEW.home_score || '-' || NEW.away_score || ' ' || COALESCE(NEW.away_team, 'Visitante')
    END,
    jsonb_build_object('group_id', p.group_id, 'match_id', p.match_id)
  FROM predictions p
  LEFT JOIN groups g ON g.id = p.group_id
  WHERE p.match_id = NEW.id
    AND COALESCE(p.points_awarded, 0) > 0
    AND NOT EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.user_id = p.user_id
        AND n.type = 'match_scored'
        AND (n.metadata->>'match_id') = p.match_id::text
        AND (n.metadata->>'group_id') = p.group_id::text
    );

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_notify_pending_points_on_match_score ON public.matches;
CREATE TRIGGER trg_notify_pending_points_on_match_score
AFTER UPDATE ON public.matches
FOR EACH ROW
EXECUTE FUNCTION public.notify_pending_points_on_match_score();
