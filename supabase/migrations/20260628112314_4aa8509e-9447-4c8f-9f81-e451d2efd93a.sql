
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

    SELECT g.name INTO _group_name FROM groups g WHERE g.id = NEW.group_id;

    _home_team := COALESCE(_home_team, 'Local');
    _away_team := COALESCE(_away_team, 'Visitante');
    _group_name := COALESCE(_group_name, 'tu grupo');

    IF NEW.points_awarded = 3 THEN
      _msg := '🎯 ¡Marcador exacto! Ganaste 3 puntos en ' || _group_name || ' — ' || _home_team || ' ' || COALESCE(_home_score::text, '?') || '-' || COALESCE(_away_score::text, '?') || ' ' || _away_team;
    ELSE
      _msg := '✅ ¡Resultado correcto! Ganaste 1 punto en ' || _group_name || ' — ' || _home_team || ' ' || COALESCE(_home_score::text, '?') || '-' || COALESCE(_away_score::text, '?') || ' ' || _away_team;
    END IF;

    INSERT INTO notifications (user_id, type, message, metadata)
    VALUES (NEW.user_id, 'match_scored', _msg, jsonb_build_object('group_id', NEW.group_id, 'match_id', NEW.match_id));
  END IF;

  RETURN NEW;
END;
$function$;
