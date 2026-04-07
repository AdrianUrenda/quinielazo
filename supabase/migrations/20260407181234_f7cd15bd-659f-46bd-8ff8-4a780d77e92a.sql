
-- Function to delete user account and all related data
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.predictions WHERE user_id = auth.uid();
  DELETE FROM public.group_members WHERE user_id = auth.uid();
  DELETE FROM public.notifications WHERE user_id = auth.uid();
  DELETE FROM public.demo_predictions WHERE user_id = auth.uid();
  DELETE FROM public.demo_group_members WHERE user_id = auth.uid();
  DELETE FROM public.groups WHERE admin_user_id = auth.uid();
  DELETE FROM public.profiles WHERE id = auth.uid();
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;

-- Allow users to delete their own profile
CREATE POLICY "Users can delete own profile"
ON public.profiles
FOR DELETE
TO authenticated
USING (auth.uid() = id);
