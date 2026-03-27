
-- Enums
CREATE TYPE public.match_stage AS ENUM ('group', 'round_of_32', 'round_of_16', 'quarterfinal', 'semifinal', 'third_place', 'final');
CREATE TYPE public.match_status AS ENUM ('upcoming', 'live', 'finished');
CREATE TYPE public.group_tier AS ENUM ('basico', 'familiar', 'grande');
CREATE TYPE public.member_status AS ENUM ('pending', 'approved', 'rejected', 'removed');
CREATE TYPE public.notification_type AS ENUM ('join_request', 'join_approved', 'join_rejected', 'match_scored', 'prediction_reminder');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Matches
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_number INT NOT NULL,
  stage match_stage NOT NULL DEFAULT 'group',
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  home_flag TEXT DEFAULT '',
  away_flag TEXT DEFAULT '',
  kickoff_utc TIMESTAMPTZ NOT NULL,
  stadium TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  home_score INT,
  away_score INT,
  status match_status NOT NULL DEFAULT 'upcoming',
  group_label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Groups
CREATE TABLE public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier group_tier NOT NULL DEFAULT 'basico',
  max_members INT NOT NULL DEFAULT 10,
  stripe_payment_id TEXT,
  invite_code TEXT UNIQUE DEFAULT encode(gen_random_bytes(8), 'hex'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Group members
CREATE TABLE public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status member_status NOT NULL DEFAULT 'pending',
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Predictions
CREATE TABLE public.predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  predicted_home_score INT NOT NULL DEFAULT 0,
  predicted_away_score INT NOT NULL DEFAULT 0,
  points_awarded INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, group_id, match_id)
);

-- Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Trigger for auto-creating profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, email, avatar_url)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', ''), NEW.email, NEW.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies

-- Profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Matches (public read)
CREATE POLICY "Anyone can view matches" ON public.matches FOR SELECT USING (true);

-- Groups
CREATE POLICY "Anyone can view groups" ON public.groups FOR SELECT USING (true);
CREATE POLICY "Auth users can create groups" ON public.groups FOR INSERT TO authenticated WITH CHECK (admin_user_id = auth.uid());
CREATE POLICY "Admin can update groups" ON public.groups FOR UPDATE TO authenticated USING (admin_user_id = auth.uid());

-- Group members
CREATE POLICY "View group members" ON public.group_members FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.groups g WHERE g.id = group_members.group_id AND g.admin_user_id = auth.uid()));
CREATE POLICY "Join groups" ON public.group_members FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND status = 'pending');
CREATE POLICY "Admin manage members" ON public.group_members FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.groups g WHERE g.id = group_members.group_id AND g.admin_user_id = auth.uid()));

-- Predictions
CREATE POLICY "View own predictions" ON public.predictions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Insert predictions" ON public.predictions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = predictions.group_id AND gm.user_id = auth.uid() AND gm.status = 'approved'));
CREATE POLICY "Update predictions before kickoff" ON public.predictions FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.matches m WHERE m.id = predictions.match_id AND m.status = 'upcoming'));

-- Notifications
CREATE POLICY "View own notifications" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());
