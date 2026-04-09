
-- Trigger function for real predictions
CREATE OR REPLACE FUNCTION public.notify_prediction_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _home_team text;
  _away_team text;
  _home_score int;
  _away_score int;
  _group_name text;
  _msg text;
  _group_id uuid;
BEGIN
  -- Only fire when points_awarded changes to > 0
  IF (NEW.points_awarded IS NOT NULL AND NEW.points_awarded > 0)
     AND (OLD.points_awarded IS NULL OR OLD.points_awarded = 0) THEN

    SELECT m.home_team, m.away_team, m.home_score, m.away_score
    INTO _home_team, _away_team, _home_score, _away_score
    FROM matches m WHERE m.id = NEW.match_id;

    SELECT g.name, g.id INTO _group_name, _group_id
    FROM groups g WHERE g.id = NEW.group_id;

    IF NEW.points_awarded = 3 THEN
      _msg := '🎯 ¡Marcador exacto! Ganaste 3 puntos en ' || _group_name || ' — ' || _home_team || ' ' || _home_score || '-' || _away_score || ' ' || _away_team;
    ELSE
      _msg := '✅ ¡Resultado correcto! Ganaste 1 punto en ' || _group_name || ' — ' || _home_team || ' ' || _home_score || '-' || _away_score || ' ' || _away_team;
    END IF;

    INSERT INTO notifications (user_id, type, message, metadata)
    VALUES (NEW.user_id, 'match_scored', _msg, jsonb_build_object('group_id', _group_id, 'match_id', NEW.match_id));
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_prediction_points
AFTER UPDATE ON predictions
FOR EACH ROW
EXECUTE FUNCTION public.notify_prediction_points();

-- Trigger function for demo predictions
CREATE OR REPLACE FUNCTION public.notify_demo_prediction_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _home_team text;
  _away_team text;
  _home_score int;
  _away_score int;
  _msg text;
BEGIN
  IF (NEW.points_awarded IS NOT NULL AND NEW.points_awarded > 0)
     AND (OLD.points_awarded IS NULL OR OLD.points_awarded = 0) THEN

    SELECT dm.home_team, dm.away_team, dm.home_score, dm.away_score
    INTO _home_team, _away_team, _home_score, _away_score
    FROM demo_matches dm WHERE dm.id = NEW.demo_match_id;

    IF NEW.points_awarded = 3 THEN
      _msg := '🎯 ¡Marcador exacto! Ganaste 3 puntos en Demo — ' || _home_team || ' ' || _home_score || '-' || _away_score || ' ' || _away_team;
    ELSE
      _msg := '✅ ¡Resultado correcto! Ganaste 1 punto en Demo — ' || _home_team || ' ' || _home_score || '-' || _away_score || ' ' || _away_team;
    END IF;

    INSERT INTO notifications (user_id, type, message, metadata)
    VALUES (NEW.user_id, 'match_scored', _msg, jsonb_build_object('match_id', NEW.demo_match_id));
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_demo_prediction_points
AFTER UPDATE ON demo_predictions
FOR EACH ROW
EXECUTE FUNCTION public.notify_demo_prediction_points();
