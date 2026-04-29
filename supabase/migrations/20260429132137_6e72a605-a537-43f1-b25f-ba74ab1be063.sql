DROP POLICY IF EXISTS "Insert predictions" ON public.predictions;
DROP POLICY IF EXISTS "Update predictions before kickoff" ON public.predictions;

CREATE POLICY "Insert predictions before kickoff"
ON public.predictions
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.group_members gm
    WHERE gm.group_id = predictions.group_id
      AND gm.user_id = auth.uid()
      AND gm.status = 'approved'
  )
  AND EXISTS (
    SELECT 1
    FROM public.matches m
    WHERE m.id = predictions.match_id
      AND m.status = 'upcoming'
      AND m.kickoff_utc > now()
  )
);

CREATE POLICY "Update predictions before kickoff"
ON public.predictions
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.matches m
    WHERE m.id = predictions.match_id
      AND m.status = 'upcoming'
      AND m.kickoff_utc > now()
  )
)
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.matches m
    WHERE m.id = predictions.match_id
      AND m.status = 'upcoming'
      AND m.kickoff_utc > now()
  )
);

DROP POLICY IF EXISTS "Users can insert own demo predictions" ON public.demo_predictions;
DROP POLICY IF EXISTS "Users can update own demo predictions" ON public.demo_predictions;

CREATE POLICY "Users can insert own demo predictions before kickoff"
ON public.demo_predictions
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.demo_group_members dgm
    WHERE dgm.user_id = auth.uid()
  )
  AND EXISTS (
    SELECT 1
    FROM public.demo_matches dm
    WHERE dm.id = demo_predictions.demo_match_id
      AND dm.status = 'upcoming'
      AND dm.kickoff_utc > now()
  )
);

CREATE POLICY "Users can update own demo predictions before kickoff"
ON public.demo_predictions
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.demo_matches dm
    WHERE dm.id = demo_predictions.demo_match_id
      AND dm.status = 'upcoming'
      AND dm.kickoff_utc > now()
  )
)
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.demo_matches dm
    WHERE dm.id = demo_predictions.demo_match_id
      AND dm.status = 'upcoming'
      AND dm.kickoff_utc > now()
  )
);