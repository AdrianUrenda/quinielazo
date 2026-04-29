-- Remove internal admin UUID exposure from public group discovery data
ALTER TABLE public.groups_discovery DROP COLUMN IF EXISTS admin_user_id;

CREATE OR REPLACE FUNCTION public.sync_groups_discovery()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.groups_discovery WHERE id = OLD.id;
    RETURN OLD;
  END IF;

  INSERT INTO public.groups_discovery (id, name, description, tier, max_members, created_at, has_access_code)
  VALUES (NEW.id, NEW.name, NEW.description, NEW.tier, NEW.max_members, NEW.created_at, NEW.access_code IS NOT NULL)
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    tier = EXCLUDED.tier,
    max_members = EXCLUDED.max_members,
    created_at = EXCLUDED.created_at,
    has_access_code = EXCLUDED.has_access_code;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_group_by_invite_code(_invite_code text)
RETURNS TABLE(id uuid, name text, description text, max_members integer, tier group_tier, has_access_code boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    gd.id,
    gd.name,
    gd.description,
    gd.max_members,
    gd.tier,
    gd.has_access_code
  FROM public.groups_discovery gd
  JOIN public.groups g ON g.id = gd.id
  WHERE g.invite_code = _invite_code
  LIMIT 1
$$;

-- Restrict demo member visibility to participants of the demo group
CREATE OR REPLACE FUNCTION public.is_demo_group_member(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.demo_group_members
    WHERE user_id = _user_id
  )
$$;

DROP POLICY IF EXISTS "Anyone authenticated can view demo members" ON public.demo_group_members;
CREATE POLICY "Demo members can view demo members"
ON public.demo_group_members
FOR SELECT
TO authenticated
USING (public.is_demo_group_member(auth.uid()));

REVOKE EXECUTE ON FUNCTION public.is_demo_group_member(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_demo_group_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_group_by_invite_code(text) TO anon, authenticated;