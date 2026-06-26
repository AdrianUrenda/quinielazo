
DROP POLICY IF EXISTS "View own predictions and finished group predictions" ON public.predictions;
CREATE POLICY "View own and locked group predictions"
ON public.predictions FOR SELECT
USING (
  (user_id = auth.uid())
  OR (
    is_group_member(auth.uid(), group_id)
    AND EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = predictions.match_id
        AND (m.status IN ('live'::match_status, 'finished'::match_status) OR m.kickoff_utc <= now())
    )
  )
);

DROP POLICY IF EXISTS "View own demo predictions and finished demo predictions" ON public.demo_predictions;
CREATE POLICY "View own and locked demo predictions"
ON public.demo_predictions FOR SELECT
USING (
  (user_id = auth.uid())
  OR (
    is_demo_group_member(auth.uid())
    AND EXISTS (
      SELECT 1 FROM demo_matches dm
      WHERE dm.id = demo_predictions.demo_match_id
        AND (dm.status IN ('live', 'finished') OR dm.kickoff_utc <= now())
    )
  )
);
