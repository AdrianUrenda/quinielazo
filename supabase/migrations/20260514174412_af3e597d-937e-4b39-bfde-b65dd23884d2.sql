DO $$
DECLARE
  v_id uuid;
  v_token text := '94d786ab1fadbde12c4f34d339bce03b5a9b2efaaf8c19062d437511525321d1';
BEGIN
  SELECT id INTO v_id FROM vault.secrets WHERE name = 'CRON_SECRET' LIMIT 1;
  IF v_id IS NULL THEN
    PERFORM vault.create_secret(v_token, 'CRON_SECRET');
  ELSE
    PERFORM vault.update_secret(v_id, v_token, 'CRON_SECRET');
  END IF;
END $$;