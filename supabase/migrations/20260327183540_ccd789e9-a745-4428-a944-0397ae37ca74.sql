-- Insert admin as approved member for existing groups where they're missing
INSERT INTO public.group_members (group_id, user_id, status)
SELECT g.id, g.admin_user_id, 'approved'::member_status
FROM public.groups g
LEFT JOIN public.group_members gm ON gm.group_id = g.id AND gm.user_id = g.admin_user_id
WHERE gm.id IS NULL;