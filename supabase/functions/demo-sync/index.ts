/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const API_BASE_URL = "https://v3.football.api-sports.io";
const LIGA_MX_LEAGUE_ID = "262";
const CLAUSURA_SEASON = "2025";
const CLAUSURA_MIN_DATE = new Date("2026-01-01T00:00:00.000Z");
const FINISHED = new Set(["FT", "AET", "PEN"]);
const LIVE = new Set(["1H", "HT", "2H", "ET", "BT", "P", "SUSP", "INT", "LIVE"]);
const TBD_NAMES = new Set(["", "tbd", "to be defined", "por definir", "undefined", "null"]);
const EXCLUDED_ROUND_TERMS = ["play-in", "play in", "regular season", "apertura", "group stage"];

const isApiError = (payload: { errors?: unknown }) => {
  if (!payload?.errors) return false;
  if (Array.isArray(payload.errors)) return payload.errors.length > 0;
  return Object.keys(payload.errors as Record<string, unknown>).length > 0;
};

const normalizeTeam = (team: { name?: string | null; logo?: string | null } | null | undefined) => {
  const rawName = team?.name?.trim() ?? "";
  const isTbd = TBD_NAMES.has(rawName.toLowerCase());
  return {
    name: isTbd ? "Por definir" : rawName,
    logo: isTbd ? null : team?.logo ?? null,
    confirmed: !isTbd,
  };
};

const normalizeStatus = (short?: string) => {
  if (FINISHED.has(short ?? "")) return "finished";
  if (LIVE.has(short ?? "")) return "live";
  return "upcoming";
};

const normalizeRound = (round?: string | null) => {
  const value = round ?? "";
  const lower = value.toLowerCase();

  if (lower.includes("reclasificacion") || lower.includes("reclasificación") || lower.includes("relegation round")) {
    return { label: "Reclasificación", order: 0 };
  }
  if (lower.includes("quarter") || lower.includes("cuarto")) {
    return { label: "Cuartos de Final", order: 1 };
  }
  if (lower.includes("semi")) {
    return { label: "Semifinales", order: 2 };
  }
  if (lower.includes("final") && !lower.includes("quarter") && !lower.includes("semi")) {
    return { label: "Final", order: 3 };
  }

  return { label: value || "Liguilla", order: 9 };
};

const isLiguillaRound = (round?: string | null) => {
  const lower = (round ?? "").toLowerCase();
  if (EXCLUDED_ROUND_TERMS.some((term) => lower.includes(term))) return false;
  return (
    lower.includes("liguilla") ||
    lower.includes("relegation round") ||
    lower.includes("quarter") ||
    lower.includes("cuarto") ||
    lower.includes("semi") ||
    lower.includes("final") ||
    lower.includes("reclasificacion") ||
    lower.includes("reclasificación")
  );
};

const isClausuraFixture = (fixture: any) => new Date(fixture?.fixture?.date ?? 0).getTime() >= CLAUSURA_MIN_DATE.getTime();

const isClausuraLiguillaFixture = (fixture: any) => isClausuraFixture(fixture) && isLiguillaRound(fixture?.league?.round);

const getExplicitLegLabel = (round: string | null | undefined) => {
  const lower = (round ?? "").toLowerCase();
  if (lower.includes("1st") || lower.includes("first") || lower.includes("ida")) return "Ida";
  if (lower.includes("2nd") || lower.includes("second") || lower.includes("vuelta")) return "Vuelta";
  return null;
};

const getTieKey = (fixture: any) => {
  const home = normalizeTeam(fixture?.teams?.home).name.toLowerCase();
  const away = normalizeTeam(fixture?.teams?.away).name.toLowerCase();
  return [home, away].sort().join("|");
};

const assignLegLabels = (fixtures: any[]) => {
  const byRound = new Map<string, any[]>();
  for (const fixture of fixtures) {
    const { label } = normalizeRound(fixture?.league?.round);
    byRound.set(label, [...(byRound.get(label) ?? []), fixture]);
  }

  const labels = new Map<number, string>();
  for (const roundFixtures of byRound.values()) {
    const sortedRound = [...roundFixtures].sort((a, b) => new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime());
    const byTie = new Map<string, any[]>();

    for (const fixture of sortedRound) {
      const explicit = getExplicitLegLabel(fixture?.league?.round);
      if (explicit) labels.set(fixture.fixture.id, explicit);
      const key = getTieKey(fixture);
      byTie.set(key, [...(byTie.get(key) ?? []), fixture]);
    }

    for (const tieFixtures of byTie.values()) {
      if (tieFixtures.length !== 2) continue;
      [...tieFixtures]
        .sort((a, b) => new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime())
        .forEach((fixture, index) => labels.set(fixture.fixture.id, index === 0 ? "Ida" : "Vuelta"));
    }

    sortedRound.forEach((fixture, index) => {
      if (!labels.has(fixture.fixture.id)) {
        labels.set(fixture.fixture.id, index < Math.ceil(sortedRound.length / 2) ? "Ida" : "Vuelta");
      }
    });
  }

  return labels;
};

const fetchFixtures = async (apiKey: string, season: string, round?: string) => {
  const params = new URLSearchParams({ league: LIGA_MX_LEAGUE_ID, season });
  if (round) params.set("round", round);
  const response = await fetch(`${API_BASE_URL}/fixtures?${params.toString()}`, {
    headers: { "x-apisports-key": apiKey },
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(`API-Football ${response.status}: ${JSON.stringify(payload)}`);
  if (isApiError(payload)) throw new Error(`API-Football errors: ${JSON.stringify(payload.errors)}`);
  return payload.response ?? [];
};

const fetchRounds = async (apiKey: string, season: string) => {
  const params = new URLSearchParams({ league: LIGA_MX_LEAGUE_ID, season });
  const response = await fetch(`${API_BASE_URL}/fixtures/rounds?${params.toString()}`, {
    headers: { "x-apisports-key": apiKey },
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(`API-Football ${response.status}: ${JSON.stringify(payload)}`);
  if (isApiError(payload)) throw new Error(`API-Football errors: ${JSON.stringify(payload.errors)}`);
  return (payload.response ?? []).filter((round: string) => isLiguillaRound(round));
};

const dedupeFixtures = (fixtures: any[]) => {
  const map = new Map<number, any>();
  fixtures.forEach((fixture) => {
    const id = fixture?.fixture?.id;
    if (id) map.set(id, fixture);
  });
  return Array.from(map.values()).sort(
    (a, b) => new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime()
  );
};

const scorePredictionsForMatch = async (supabase: any, matchId: string, homeScore: number, awayScore: number) => {
  const { data: preds } = await supabase
    .from("demo_predictions")
    .select("id, predicted_home_score, predicted_away_score")
    .eq("demo_match_id", matchId);

  let scored = 0;
  for (const pred of preds || []) {
    const actualOutcome = Math.sign(homeScore - awayScore);
    const predictedOutcome = Math.sign(pred.predicted_home_score - pred.predicted_away_score);
    const points = pred.predicted_home_score === homeScore && pred.predicted_away_score === awayScore
      ? 3
      : predictedOutcome === actualOutcome
        ? 1
        : 0;

    await supabase.from("demo_predictions").update({ points_awarded: points }).eq("id", pred.id);
    scored++;
  }
  return scored;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    let body: any = {};
    if (req.method !== "GET") {
      try { body = await req.json(); } catch { body = {}; }
    }
    const action = url.searchParams.get("action") || body.action;

    if (action === "sync-liguilla") {
      const apiKey = Deno.env.get("API_FOOTBALL_KEY");
      if (!apiKey) throw new Error("API_FOOTBALL_KEY is not configured");

      let selectedSeason = SEASONS[0];
      let fixtures: any[] = [];

      for (const season of SEASONS) {
        const collected: any[] = [];
        const liguilla = await fetchFixtures(apiKey, season, "Liguilla");
        collected.push(...liguilla);
        for (const round of ROUND_PROBES.filter((r) => r !== "Liguilla")) {
          collected.push(...await fetchFixtures(apiKey, season, round));
        }
        if (!collected.length) {
          const all = await fetchFixtures(apiKey, season);
          collected.push(...all.filter((fixture: any) => isLiguillaRound(fixture?.league?.round)));
        }
        fixtures = dedupeFixtures(collected).filter(
          (fixture) => isLiguillaRound(fixture?.league?.round)
        );
        if (fixtures.length) {
          selectedSeason = season;
          break;
        }
      }

      const legLabels = assignLegLabels(fixtures);
      const rows = fixtures.map((fixture: any) => {
        const round = fixture?.league?.round ?? "Liguilla";
        const { label, order } = normalizeRound(round);
        const home = normalizeTeam(fixture?.teams?.home);
        const away = normalizeTeam(fixture?.teams?.away);
        const shortStatus = fixture?.fixture?.status?.short ?? "NS";
        const status = normalizeStatus(shortStatus);

        return {
          api_fixture_id: fixture.fixture.id,
          jornada: 900 + order,
          kickoff_utc: fixture.fixture.date,
          stadium: fixture.fixture.venue?.name ?? "",
          city: fixture.fixture.venue?.city ?? "",
          status,
          home_score: status === "finished" ? fixture.goals?.home ?? null : null,
          away_score: status === "finished" ? fixture.goals?.away ?? null : null,
          home_team: home.name || "Por definir",
          away_team: away.name || "Por definir",
          home_team_logo: home.logo,
          away_team_logo: away.logo,
          round_label: label,
          round_order: order,
          leg_label: legLabels.get(fixture.fixture.id) ?? null,
          status_detail: shortStatus,
          last_synced_at: new Date().toISOString(),
        };
      });

      if (rows.length) {
        const fixtureIds = rows.map((row) => row.api_fixture_id);
        const { data: existing, error: existingError } = await supabase
          .from("demo_matches")
          .select("id, api_fixture_id")
          .in("api_fixture_id", fixtureIds);
        if (existingError) throw existingError;

        const existingByFixture = new Map((existing || []).map((match: any) => [match.api_fixture_id, match.id]));
        for (const row of rows) {
          const existingId = existingByFixture.get(row.api_fixture_id);
          const result = existingId
            ? await supabase.from("demo_matches").update(row).eq("id", existingId)
            : await supabase.from("demo_matches").insert(row);
          if (result.error) throw result.error;
        }
      }

      const finishedRows = rows.filter((row) => row.status === "finished" && row.home_score !== null && row.away_score !== null);
      let predictionsScored = 0;
      for (const row of finishedRows) {
        const { data: match } = await supabase
          .from("demo_matches")
          .select("id")
          .eq("api_fixture_id", row.api_fixture_id)
          .single();
        if (match?.id) {
          predictionsScored += await scorePredictionsForMatch(supabase, match.id, row.home_score, row.away_score);
        }
      }

      return new Response(
        JSON.stringify({
          message: "Liguilla synced",
          season: selectedSeason,
          fixturesSynced: rows.length,
          predictionsScored,
          updatedAt: new Date().toISOString(),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "update-score") {
      const { matchId, homeScore, awayScore } = body;

      if (!matchId || homeScore === undefined || awayScore === undefined) {
        return new Response(JSON.stringify({ error: "matchId, homeScore, awayScore required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error: updateErr } = await supabase
        .from("demo_matches")
        .update({
          status: "finished",
          status_detail: "FT",
          home_score: homeScore,
          away_score: awayScore,
          last_synced_at: new Date().toISOString(),
        })
        .eq("id", matchId);

      if (updateErr) throw updateErr;
      const scored = await scorePredictionsForMatch(supabase, matchId, homeScore, awayScore);

      return new Response(JSON.stringify({ message: "Score updated", predictionsScored: scored }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "reset") {
      await supabase.from("demo_predictions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase
        .from("demo_matches")
        .update({ status: "upcoming", status_detail: "NS", home_score: null, away_score: null })
        .neq("id", "00000000-0000-0000-0000-000000000000");

      return new Response(JSON.stringify({ message: "Demo reset complete" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action. Use: sync-liguilla, update-score, reset" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("demo-sync error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
