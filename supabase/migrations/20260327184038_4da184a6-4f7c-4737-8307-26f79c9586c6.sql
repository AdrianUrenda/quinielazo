-- Allow group members to view predictions of other members in the same group
DROP POLICY "View own predictions" ON public.predictions;

CREATE POLICY "View group predictions" ON public.predictions
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = predictions.group_id
        AND gm.user_id = auth.uid()
        AND gm.status = 'approved'::member_status
    )
  );