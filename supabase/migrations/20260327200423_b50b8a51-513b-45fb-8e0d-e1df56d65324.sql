
-- Demo matches table
CREATE TABLE public.demo_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_fixture_id INTEGER UNIQUE NOT NULL,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  home_team_logo TEXT,
  away_team_logo TEXT,
  kickoff_utc TIMESTAMP WITH TIME ZONE NOT NULL,
  stadium TEXT DEFAULT '',
  city TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'finished')),
  home_score INTEGER,
  away_score INTEGER,
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.demo_matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view demo matches" ON public.demo_matches FOR SELECT TO public USING (true);

-- Demo group members table (must be before demo_predictions for FK reference in policy)
CREATE TABLE public.demo_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.demo_group_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can view demo members" ON public.demo_group_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can join demo group" ON public.demo_group_members FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Demo predictions table
CREATE TABLE public.demo_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  demo_match_id UUID NOT NULL REFERENCES public.demo_matches(id) ON DELETE CASCADE,
  predicted_home_score INTEGER NOT NULL DEFAULT 0,
  predicted_away_score INTEGER NOT NULL DEFAULT 0,
  points_awarded INTEGER,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, demo_match_id)
);

ALTER TABLE public.demo_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own demo predictions" ON public.demo_predictions
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "View others demo predictions for finished matches" ON public.demo_predictions
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.demo_matches dm WHERE dm.id = demo_predictions.demo_match_id AND dm.status = 'finished')
    AND EXISTS (SELECT 1 FROM public.demo_group_members dgm WHERE dgm.user_id = auth.uid())
  );

CREATE POLICY "Users can insert own demo predictions" ON public.demo_predictions
  FOR INSERT TO authenticated WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.demo_group_members dgm WHERE dgm.user_id = auth.uid())
  );

CREATE POLICY "Users can update own demo predictions" ON public.demo_predictions
  FOR UPDATE TO authenticated USING (
    user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.demo_matches dm WHERE dm.id = demo_predictions.demo_match_id AND dm.status = 'upcoming')
  );
