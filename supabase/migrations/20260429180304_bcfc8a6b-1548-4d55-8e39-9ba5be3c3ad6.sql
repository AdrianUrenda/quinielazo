ALTER TABLE public.groups
ALTER COLUMN max_members SET DEFAULT 8;

UPDATE public.groups
SET max_members = 8
WHERE tier = 'basico'
  AND max_members = 10;