
-- Drop the overly permissive public SELECT policy
DROP POLICY "Anyone can view groups" ON public.groups;

-- Authenticated users can view groups (but we'll handle column exposure in app code)
CREATE POLICY "Authenticated users can view groups"
ON public.groups FOR SELECT
TO authenticated
USING (true);

-- Create a security definer function to validate access codes server-side
CREATE OR REPLACE FUNCTION public.validate_group_access_code(
  _group_id uuid,
  _code text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.groups
    WHERE id = _group_id
      AND (access_code IS NULL OR access_code = _code)
  )
$$;

-- Create a safe view for group discovery that hides sensitive columns
CREATE OR REPLACE VIEW public.groups_discovery
WITH (security_invoker = on) AS
  SELECT 
    id, 
    name, 
    description, 
    tier, 
    max_members, 
    admin_user_id,
    created_at,
    (access_code IS NOT NULL) AS has_access_code
  FROM public.groups;
