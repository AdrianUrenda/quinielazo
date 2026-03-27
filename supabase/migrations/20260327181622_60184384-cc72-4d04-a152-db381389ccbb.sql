-- Allow authenticated users to insert notifications
CREATE POLICY "Insert notifications" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (true);
