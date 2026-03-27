
-- Replace the broad SELECT policy with one scoped to members/admins
DROP POLICY "Authenticated users can view groups" ON public.groups;

CREATE POLICY "Members and admins can view groups"
ON public.groups FOR SELECT
TO authenticated
USING (
  admin_user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = id
      AND gm.user_id = auth.uid()
      AND gm.status = 'approved'
  )
);
