-- Enable extensions for scheduled HTTP calls
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Remove any prior version of the job
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'sync-world-cup-fixtures-hourly') THEN
    PERFORM cron.unschedule('sync-world-cup-fixtures-hourly');
  END IF;
END $$;

-- Schedule hourly sync of World Cup fixtures
SELECT cron.schedule(
  'sync-world-cup-fixtures-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://yodixfzcxmuvaabfucgh.supabase.co/functions/v1/api-football-fixtures',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{"action":"sync-matches"}'::jsonb
  );
  $$
);