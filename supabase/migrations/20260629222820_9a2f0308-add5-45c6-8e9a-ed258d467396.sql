
-- Plan 3: snapshots cada 4h
SELECT cron.unschedule('daily-matches-predictions-snapshot');
SELECT cron.schedule(
  'matches-predictions-snapshot-4h',
  '0 */4 * * *',
  $$ SELECT public.snapshot_matches_and_predictions(); $$
);

-- Plan 4: tabla de auditoría
CREATE TABLE IF NOT EXISTS public.mutation_audit_log (
  id BIGSERIAL PRIMARY KEY,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  row_pk UUID,
  actor_uid UUID,
  actor_role TEXT,
  session_user_name TEXT,
  application_name TEXT,
  old_row JSONB,
  new_row JSONB
);

GRANT SELECT ON public.mutation_audit_log TO authenticated;
GRANT ALL ON public.mutation_audit_log TO service_role;

ALTER TABLE public.mutation_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit log"
ON public.mutation_audit_log FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE INDEX IF NOT EXISTS idx_mutation_audit_log_table_time ON public.mutation_audit_log (table_name, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_mutation_audit_log_row_pk ON public.mutation_audit_log (row_pk);

CREATE OR REPLACE FUNCTION public.log_mutation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _pk UUID;
  _old JSONB;
  _new JSONB;
BEGIN
  IF TG_OP = 'DELETE' THEN
    _old := to_jsonb(OLD);
    _pk := (OLD).id;
  ELSIF TG_OP = 'INSERT' THEN
    _new := to_jsonb(NEW);
    _pk := (NEW).id;
  ELSE
    _old := to_jsonb(OLD);
    _new := to_jsonb(NEW);
    _pk := (NEW).id;
  END IF;

  INSERT INTO public.mutation_audit_log
    (table_name, operation, row_pk, actor_uid, actor_role, session_user_name, application_name, old_row, new_row)
  VALUES
    (TG_TABLE_NAME, TG_OP, _pk, auth.uid(),
     current_setting('request.jwt.claim.role', true),
     session_user,
     current_setting('application_name', true),
     _old, _new);

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$;

DROP TRIGGER IF EXISTS audit_predictions_mutations ON public.predictions;
CREATE TRIGGER audit_predictions_mutations
AFTER INSERT OR UPDATE OR DELETE ON public.predictions
FOR EACH ROW EXECUTE FUNCTION public.log_mutation();

DROP TRIGGER IF EXISTS audit_matches_mutations ON public.matches;
CREATE TRIGGER audit_matches_mutations
AFTER INSERT OR UPDATE OR DELETE ON public.matches
FOR EACH ROW EXECUTE FUNCTION public.log_mutation();
