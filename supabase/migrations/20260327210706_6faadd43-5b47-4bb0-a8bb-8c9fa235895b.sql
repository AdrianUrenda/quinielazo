
-- Create a security definer function to check group membership without triggering RLS
CREATE OR REPLACE FUNCTION public.is_group_member(_user_id uuid, _group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE user_id = _user_id
      AND group_id = _group_id
      AND status = 'approved'
  )
$$;

-- Create a security definer function to check if user is group admin
CREATE OR REPLACE FUNCTION public.is_group_admin(_user_id uuid, _group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.groups
    WHERE id = _group_id
      AND admin_user_id = _user_id
  )
$$;

-- Fix groups SELECT policy using security definer function
DROP POLICY "Members and admins can view groups" ON public.groups;

CREATE POLICY "Members and admins can view groups"
ON public.groups FOR SELECT
TO authenticated
USING (
  admin_user_id = auth.uid()
  OR public.is_group_member(auth.uid(), id)
);

-- Fix group_members SELECT policy to avoid recursion
DROP POLICY "View group members" ON public.group_members;

CREATE POLICY "View group members"
ON public.group_members FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_group_admin(auth.uid(), group_id)
);
