-- Drop the overly permissive policy and replace with a scoped one
DROP POLICY "Insert notifications" ON public.notifications;

CREATE POLICY "Insert notifications for group actions" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (
    type IN ('join_request', 'join_approved', 'join_rejected')
  );
