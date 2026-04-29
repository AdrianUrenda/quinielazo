CREATE OR REPLACE FUNCTION public.get_group_details(_group_id uuid)
RETURNS TABLE(
  id uuid,
  name text,
  description text,
  admin_user_id uuid,
  tier public.group_tier,
  max_members integer,
  created_at timestamp with time zone,
  invite_code text,
  access_code text,
  prize_description text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    g.id,
    g.name,
    g.description,
    g.admin_user_id,
    g.tier,
    g.max_members,
    g.created_at,
    CASE WHEN g.admin_user_id = auth.uid() THEN g.invite_code ELSE NULL END AS invite_code,
    CASE WHEN g.admin_user_id = auth.uid() THEN g.access_code ELSE NULL END AS access_code,
    g.prize_description
  FROM public.groups g
  WHERE g.id = _group_id
    AND (g.admin_user_id = auth.uid() OR public.is_group_member(auth.uid(), g.id))
  LIMIT 1
$$;

DROP POLICY IF EXISTS "Members and admins can view groups" ON public.groups;
DROP POLICY IF EXISTS "Admins can view groups" ON public.groups;
CREATE POLICY "Admins can view groups"
ON public.groups
FOR SELECT
TO authenticated
USING (admin_user_id = auth.uid());

DROP POLICY IF EXISTS "View group predictions" ON public.predictions;
CREATE POLICY "View own predictions and finished group predictions"
ON public.predictions
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR (
    public.is_group_member(auth.uid(), group_id)
    AND EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = predictions.match_id
        AND m.status = 'finished'::public.match_status
    )
  )
);

DROP POLICY IF EXISTS "View others demo predictions in demo group" ON public.demo_predictions;
DROP POLICY IF EXISTS "Users can view own demo predictions" ON public.demo_predictions;
CREATE POLICY "View own demo predictions and finished demo predictions"
ON public.demo_predictions
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR (
    public.is_demo_group_member(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.demo_matches dm
      WHERE dm.id = demo_predictions.demo_match_id
        AND dm.status = 'finished'
    )
  )
);

REVOKE EXECUTE ON FUNCTION public.get_group_details(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_group_details(uuid) TO authenticated;