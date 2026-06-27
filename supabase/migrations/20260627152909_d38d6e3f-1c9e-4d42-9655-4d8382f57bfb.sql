
-- Recovery of predictions for 8 group-stage matches whose records were accidentally deleted.
-- Source of truth: 'match_scored' notifications + group membership snapshots.

BEGIN;

-- Temporarily disable the trigger that fires duplicate notifications when points_awarded transitions to > 0.
ALTER TABLE public.predictions DISABLE TRIGGER USER;

-- Per-match placeholder map:
--   p3_h/p3_a = exact actual score (awarded 3 pts)
--   p1_h/p1_a = same outcome, different score (awarded 1 pt)
--   p0_h/p0_a = wrong outcome placeholder (0 pts)
WITH m AS (
  SELECT * FROM (VALUES
    ('9f7c8a6e-2ee1-438b-8637-9a0041d69682'::uuid, 'Czechia','South Africa',     1,1, 0,0, 1,0),
    ('a84b5f42-9af1-4c51-99ae-40551527c075'::uuid, 'Belgium','Egypt',            1,1, 0,0, 1,0),
    ('28c2d435-069c-40cc-9194-25b6f083af2b'::uuid, 'Iran','New Zealand',         2,2, 0,0, 1,0),
    ('8778b7b2-35ba-45c9-a441-13ee4ffcd51c'::uuid, 'Saudi Arabia','Uruguay',     1,1, 0,0, 1,0),
    ('087ffb50-cbe6-4590-a9bf-5956bed78b6a'::uuid, 'Iraq','Norway',              1,4, 0,2, 1,0),
    ('5a6cf2fb-1fd2-440f-b066-4103ad051166'::uuid, 'Austria','Jordan',           3,1, 2,0, 0,1),
    ('ac8a2482-b5aa-4c36-9aad-bf093bf20736'::uuid, 'Portugal','Congo DR',        1,1, 0,0, 1,0),
    ('f0e5479c-e023-4315-9e3a-3100ae9bb389'::uuid, 'England','Croatia',          4,2, 2,0, 0,1)
  ) AS t(match_id, home_team, away_team, p3_h,p3_a, p1_h,p1_a, p0_h,p0_a)
),
-- Active groups per match: groups that received at least one match_scored notification for that match.
active_groups AS (
  SELECT DISTINCT m.match_id, (n.metadata->>'group_id')::uuid AS group_id
  FROM m
  JOIN public.notifications n
    ON n.type = 'match_scored'
   AND n.message LIKE '%— ' || m.home_team || ' ' || m.p3_h || '-' || m.p3_a || ' ' || m.away_team
),
-- Step 1: 0-point placeholders for every approved member of an active group.
zero_inserts AS (
  INSERT INTO public.predictions (user_id, group_id, match_id, predicted_home_score, predicted_away_score, points_awarded)
  SELECT gm.user_id, ag.group_id, m.match_id, m.p0_h, m.p0_a, 0
  FROM active_groups ag
  JOIN m ON m.match_id = ag.match_id
  JOIN public.group_members gm
    ON gm.group_id = ag.group_id
   AND gm.status = 'approved'::public.member_status
  ON CONFLICT (user_id, group_id, match_id) DO NOTHING
  RETURNING 1
),
-- Step 2: upsert real scoring rows from notifications, overwriting placeholders where applicable.
scored AS (
  SELECT
    n.user_id,
    (n.metadata->>'group_id')::uuid AS group_id,
    m.match_id,
    CASE WHEN n.message LIKE '%3 puntos%' THEN m.p3_h ELSE m.p1_h END AS h,
    CASE WHEN n.message LIKE '%3 puntos%' THEN m.p3_a ELSE m.p1_a END AS a,
    CASE WHEN n.message LIKE '%3 puntos%' THEN 3 ELSE 1 END AS pts
  FROM m
  JOIN public.notifications n
    ON n.type = 'match_scored'
   AND n.message LIKE '%— ' || m.home_team || ' ' || m.p3_h || '-' || m.p3_a || ' ' || m.away_team
),
-- Deduplicate (in the unlikely case the same user/group/match has more than one notification, keep the highest pts).
scored_dedup AS (
  SELECT DISTINCT ON (user_id, group_id, match_id)
    user_id, group_id, match_id, h, a, pts
  FROM scored
  ORDER BY user_id, group_id, match_id, pts DESC
)
INSERT INTO public.predictions (user_id, group_id, match_id, predicted_home_score, predicted_away_score, points_awarded)
SELECT user_id, group_id, match_id, h, a, pts FROM scored_dedup
ON CONFLICT (user_id, group_id, match_id) DO UPDATE
  SET predicted_home_score = EXCLUDED.predicted_home_score,
      predicted_away_score = EXCLUDED.predicted_away_score,
      points_awarded       = EXCLUDED.points_awarded,
      updated_at           = now();

-- Re-enable triggers.
ALTER TABLE public.predictions ENABLE TRIGGER USER;

COMMIT;
