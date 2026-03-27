
-- Fix group_members SELECT: allow approved members to see all members in their group
DROP POLICY "View group members" ON public.group_members;
CREATE POLICY "View group members" ON public.group_members
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR is_group_member(auth.uid(), group_id)
    OR is_group_admin(auth.uid(), group_id)
  );

-- Create a security definer function for member counts (bypasses RLS for discovery)
CREATE OR REPLACE FUNCTION public.get_group_member_count(_group_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::integer FROM public.group_members
  WHERE group_id = _group_id AND status = 'approved'
$$;
