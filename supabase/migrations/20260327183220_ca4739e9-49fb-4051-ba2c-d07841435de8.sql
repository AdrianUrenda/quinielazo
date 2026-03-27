-- Drop the old restrictive insert policy
DROP POLICY "Join groups" ON public.group_members;

-- Allow users to insert themselves as pending, OR group admins to insert as approved
CREATE POLICY "Join groups" ON public.group_members
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (
      status = 'pending'::member_status
      OR (
        status = 'approved'::member_status
        AND EXISTS (
          SELECT 1 FROM groups g WHERE g.id = group_members.group_id AND g.admin_user_id = auth.uid()
        )
      )
    )
  );