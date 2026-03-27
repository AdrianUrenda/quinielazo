-- Allow admins to delete their own groups
CREATE POLICY "Admin can delete groups"
ON public.groups
FOR DELETE
TO authenticated
USING (admin_user_id = auth.uid());

-- Allow deletion of group_members when group is deleted (by admin)
CREATE POLICY "Admin can delete group members"
ON public.group_members
FOR DELETE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM groups g
  WHERE g.id = group_members.group_id
  AND g.admin_user_id = auth.uid()
));

-- Add ON DELETE CASCADE to group_members -> groups FK
ALTER TABLE public.group_members
DROP CONSTRAINT IF EXISTS group_members_group_id_fkey;

ALTER TABLE public.group_members
ADD CONSTRAINT group_members_group_id_fkey
FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;

-- Also cascade predictions
ALTER TABLE public.predictions
DROP CONSTRAINT IF EXISTS predictions_group_id_fkey;

ALTER TABLE public.predictions
ADD CONSTRAINT predictions_group_id_fkey
FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;