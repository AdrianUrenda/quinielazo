-- Role enum, helper, and role table for server-side admin checks
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typnamespace = 'public'::regnamespace AND typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin'::public.app_role)
$$;

DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Public-safe profile data without email addresses
CREATE TABLE IF NOT EXISTS public.public_profiles (
  id uuid PRIMARY KEY,
  display_name text NOT NULL DEFAULT '',
  avatar_url text,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.public_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view public profiles" ON public.public_profiles;
CREATE POLICY "Authenticated users can view public profiles"
ON public.public_profiles
FOR SELECT
TO authenticated
USING (true);

INSERT INTO public.public_profiles (id, display_name, avatar_url, updated_at)
SELECT id, display_name, avatar_url, updated_at
FROM public.profiles
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  avatar_url = EXCLUDED.avatar_url,
  updated_at = EXCLUDED.updated_at;

CREATE OR REPLACE FUNCTION public.sync_public_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.public_profiles WHERE id = OLD.id;
    RETURN OLD;
  END IF;

  INSERT INTO public.public_profiles (id, display_name, avatar_url, updated_at)
  VALUES (NEW.id, NEW.display_name, NEW.avatar_url, NEW.updated_at)
  ON CONFLICT (id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = EXCLUDED.updated_at;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_public_profile_trigger ON public.profiles;
CREATE TRIGGER sync_public_profile_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_public_profile();

DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Replace security-definer group discovery view with an RLS-protected table
DROP VIEW IF EXISTS public.groups_discovery;

CREATE TABLE IF NOT EXISTS public.groups_discovery (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  description text,
  tier public.group_tier NOT NULL,
  max_members integer NOT NULL,
  admin_user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL,
  has_access_code boolean NOT NULL DEFAULT false
);

ALTER TABLE public.groups_discovery ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view group discovery" ON public.groups_discovery;
CREATE POLICY "Anyone can view group discovery"
ON public.groups_discovery
FOR SELECT
TO anon, authenticated
USING (true);

INSERT INTO public.groups_discovery (id, name, description, tier, max_members, admin_user_id, created_at, has_access_code)
SELECT id, name, description, tier, max_members, admin_user_id, created_at, (access_code IS NOT NULL)
FROM public.groups
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  tier = EXCLUDED.tier,
  max_members = EXCLUDED.max_members,
  admin_user_id = EXCLUDED.admin_user_id,
  created_at = EXCLUDED.created_at,
  has_access_code = EXCLUDED.has_access_code;

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

  INSERT INTO public.groups_discovery (id, name, description, tier, max_members, admin_user_id, created_at, has_access_code)
  VALUES (NEW.id, NEW.name, NEW.description, NEW.tier, NEW.max_members, NEW.admin_user_id, NEW.created_at, NEW.access_code IS NOT NULL)
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    tier = EXCLUDED.tier,
    max_members = EXCLUDED.max_members,
    admin_user_id = EXCLUDED.admin_user_id,
    created_at = EXCLUDED.created_at,
    has_access_code = EXCLUDED.has_access_code;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_groups_discovery_trigger ON public.groups;
CREATE TRIGGER sync_groups_discovery_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.groups
FOR EACH ROW
EXECUTE FUNCTION public.sync_groups_discovery();

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

-- Move notification creation for join flows into server-side functions
CREATE OR REPLACE FUNCTION public.request_group_membership(_group_id uuid, _access_code text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _group public.groups%ROWTYPE;
  _member_count integer;
  _display_name text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT * INTO _group FROM public.groups WHERE id = _group_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Group not found';
  END IF;

  IF _group.access_code IS NOT NULL AND _group.access_code <> COALESCE(_access_code, '') THEN
    RAISE EXCEPTION 'Invalid access code';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = _group_id AND user_id = auth.uid() AND status IN ('pending', 'approved')
  ) THEN
    RAISE EXCEPTION 'Membership request already exists';
  END IF;

  SELECT public.get_group_member_count(_group_id) INTO _member_count;
  IF _member_count >= _group.max_members THEN
    RAISE EXCEPTION 'Group is full';
  END IF;

  INSERT INTO public.group_members (group_id, user_id, status)
  VALUES (_group_id, auth.uid(), 'pending'::public.member_status);

  SELECT display_name INTO _display_name FROM public.profiles WHERE id = auth.uid();

  INSERT INTO public.notifications (user_id, type, message, metadata)
  VALUES (
    _group.admin_user_id,
    'join_request'::public.notification_type,
    COALESCE(NULLIF(_display_name, ''), 'Un usuario') || ' quiere unirse a ' || _group.name || '.',
    jsonb_build_object('group_id', _group_id, 'requester_id', auth.uid())
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.update_group_member_status(_member_id uuid, _status public.member_status)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _member public.group_members%ROWTYPE;
  _group public.groups%ROWTYPE;
  _member_count integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF _status NOT IN ('approved'::public.member_status, 'rejected'::public.member_status, 'removed'::public.member_status) THEN
    RAISE EXCEPTION 'Invalid member status';
  END IF;

  SELECT * INTO _member FROM public.group_members WHERE id = _member_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Membership not found';
  END IF;

  SELECT * INTO _group FROM public.groups WHERE id = _member.group_id;
  IF NOT FOUND OR _group.admin_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  IF _status = 'approved'::public.member_status THEN
    SELECT public.get_group_member_count(_member.group_id) INTO _member_count;
    IF _member_count >= _group.max_members THEN
      RAISE EXCEPTION 'Group is full';
    END IF;
  END IF;

  UPDATE public.group_members
  SET status = _status
  WHERE id = _member_id;

  IF _status = 'approved'::public.member_status THEN
    INSERT INTO public.notifications (user_id, type, message, metadata)
    VALUES (
      _member.user_id,
      'join_approved'::public.notification_type,
      'Tu solicitud para unirte a ' || _group.name || ' fue aprobada. ¡Ya puedes participar!',
      jsonb_build_object('group_id', _member.group_id)
    );
  ELSIF _status = 'rejected'::public.member_status THEN
    INSERT INTO public.notifications (user_id, type, message, metadata)
    VALUES (
      _member.user_id,
      'join_rejected'::public.notification_type,
      'Tu solicitud para unirte a ' || _group.name || ' no fue aprobada.',
      jsonb_build_object('group_id', _member.group_id)
    );
  END IF;
END;
$$;

DROP POLICY IF EXISTS "Insert notifications for group actions" ON public.notifications;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.notifications;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'group_members'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.group_members;
  END IF;
END $$;

-- Restrict direct execution of security definer functions to the roles that need them
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM anon;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM authenticated;

GRANT EXECUTE ON FUNCTION public.get_group_by_invite_code(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_group_access_code(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_group_member_count(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_group_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_group_admin(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_group_membership(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_group_member_status(uuid, public.member_status) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_is_admin() TO authenticated;

GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.groups_discovery TO anon, authenticated;