-- Recreate the view WITHOUT security_invoker so all authenticated users can discover groups
DROP VIEW IF EXISTS public.groups_discovery;

CREATE VIEW public.groups_discovery AS
  SELECT id,
    name,
    description,
    tier,
    max_members,
    admin_user_id,
    created_at,
    (access_code IS NOT NULL) AS has_access_code
  FROM public.groups;

GRANT SELECT ON public.groups_discovery TO authenticated;
GRANT SELECT ON public.groups_discovery TO anon;