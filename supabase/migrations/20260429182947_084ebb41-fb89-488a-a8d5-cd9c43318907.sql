INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM public.profiles
WHERE email = 'adrianurenda.sp@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;