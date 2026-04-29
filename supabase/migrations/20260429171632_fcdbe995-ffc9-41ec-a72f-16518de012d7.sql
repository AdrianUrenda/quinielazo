WITH normalized AS (
  SELECT
    id,
    CASE
      WHEN lower(round_label) LIKE '%play-in%semi%' OR lower(round_label) LIKE '%reclas%' THEN 'Play-In'
      WHEN lower(round_label) LIKE '%play-in%final%' THEN 'Play-In'
      WHEN lower(round_label) LIKE '%quarter%' OR lower(round_label) LIKE '%cuarto%' THEN 'Cuartos de Final'
      WHEN lower(round_label) LIKE '%semi%' THEN 'Semifinales'
      WHEN lower(round_label) LIKE '%final%' THEN 'Final'
      ELSE COALESCE(round_label, 'Liguilla')
    END AS normalized_round_label,
    CASE
      WHEN lower(round_label) LIKE '%play-in%semi%' OR lower(round_label) LIKE '%reclas%' THEN 0
      WHEN lower(round_label) LIKE '%play-in%final%' THEN 0
      WHEN lower(round_label) LIKE '%quarter%' OR lower(round_label) LIKE '%cuarto%' THEN 1
      WHEN lower(round_label) LIKE '%semi%' THEN 2
      WHEN lower(round_label) LIKE '%final%' THEN 3
      ELSE COALESCE(round_order, 9)
    END AS normalized_round_order,
    CASE
      WHEN lower(COALESCE(home_team, '')) < lower(COALESCE(away_team, ''))
        THEN lower(COALESCE(home_team, '')) || '|' || lower(COALESCE(away_team, ''))
      ELSE lower(COALESCE(away_team, '')) || '|' || lower(COALESCE(home_team, ''))
    END AS tie_key,
    kickoff_utc
  FROM public.demo_matches
  WHERE jornada >= 900 OR round_label IS NOT NULL
), ranked AS (
  SELECT
    id,
    normalized_round_label,
    normalized_round_order,
    CASE
      WHEN count(*) OVER (PARTITION BY normalized_round_label, tie_key) = 2 THEN
        CASE WHEN row_number() OVER (PARTITION BY normalized_round_label, tie_key ORDER BY kickoff_utc, id) = 1 THEN 'Ida' ELSE 'Vuelta' END
      ELSE
        CASE
          WHEN row_number() OVER (PARTITION BY normalized_round_label ORDER BY kickoff_utc, id) <= CEIL(count(*) OVER (PARTITION BY normalized_round_label) / 2.0) THEN 'Ida'
          ELSE 'Vuelta'
        END
    END AS normalized_leg_label
  FROM normalized
)
UPDATE public.demo_matches dm
SET
  round_label = ranked.normalized_round_label,
  round_order = ranked.normalized_round_order,
  leg_label = ranked.normalized_leg_label
FROM ranked
WHERE dm.id = ranked.id;