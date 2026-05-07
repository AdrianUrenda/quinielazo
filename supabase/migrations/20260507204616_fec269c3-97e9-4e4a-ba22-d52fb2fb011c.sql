-- Ensure vault extension is available for storing the cron secret in the database
CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;

-- Helper that reads the cron secret from vault (returns empty string if missing)
CREATE OR REPLACE FUNCTION public._cron_secret()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, vault
AS $$
  SELECT COALESCE(
    (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET' LIMIT 1),
    ''
  )
$$;

-- Lock down the helper so only superuser/cron can invoke it
REVOKE ALL ON FUNCTION public._cron_secret() FROM PUBLIC, anon, authenticated;

-- Reschedule the hourly job to authenticate via CRON_SECRET stored in vault
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'sync-world-cup-fixtures-hourly') THEN
    PERFORM cron.unschedule('sync-world-cup-fixtures-hourly');
  END IF;
END $$;

SELECT cron.schedule(
  'sync-world-cup-fixtures-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://yodixfzcxmuvaabfucgh.supabase.co/functions/v1/api-football-fixtures',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || public._cron_secret()
    ),
    body := '{"action":"sync-matches"}'::jsonb
  );
  $$
);