
DROP POLICY "View others demo predictions for finished matches" ON public.demo_predictions;

CREATE POLICY "View others demo predictions in demo group" ON public.demo_predictions
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM demo_group_members dgm WHERE dgm.user_id = auth.uid()
    )
  );
