CREATE OR REPLACE FUNCTION public.get_group_by_invite_code(_invite_code text)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  max_members integer,
  tier group_tier,
  has_access_code boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    g.id,
    g.name,
    g.description,
    g.max_members,
    g.tier,
    (g.access_code IS NOT NULL) AS has_access_code
  FROM public.groups g
  WHERE g.invite_code = _invite_code
  LIMIT 1
$$;

GRANT EXECUTE ON FUNCTION public.get_group_by_invite_code(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_group_by_invite_code(text) TO authenticated;