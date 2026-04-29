/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const API_BASE_URL = "https://v3.football.api-sports.io";
const WORLD_CUP_LEAGUE_ID = "1";
const WORLD_CUP_SEASON = "2026";
const FINISHED = new Set(["FT", "AET", "PEN"]);
const LIVE = new Set(["1H", "HT", "2H", "ET", "BT", "P", "LIVE"]);

const hasApiErrors = (payload: { errors?: unknown }) => {
  if (!payload?.errors) return false;
  if (Array.isArray(payload.errors)) return payload.errors.length > 0;
  return Object.keys(payload.errors as Record<string, unknown>).length > 0;
};

const normalizeStatus = (short?: string | null) => {
  if (FINISHED.has(short ?? "")) return "finished";
  if (LIVE.has(short ?? "")) return "live";
  return "upcoming";
};

const getStage = (round?: string | null) => {
  const value = (round || "").toLowerCase();
  if (value.includes("group")) return "group";
  if (value.includes("round of 32")) return "round_of_32";
  if (value.includes("round of 16") || value.includes("8th finals")) return "round_of_16";
  if (value.includes("quarter")) return "quarterfinal";
  if (value.includes("semi")) return "semifinal";
  if (value.includes("3rd") || value.includes("third")) return "third_place";
  if (value.includes("final")) return "final";
  return "group";
};

const getGroup = (round?: string | null) => round?.match(/group\s+([A-L])/i)?.[1]?.toUpperCase() ?? null;

const getScore = (fixture: any, side: "home" | "away", status: string) =>
  status === "finished" || status === "live" ? fixture?.goals?.[side] ?? null : null;

const fetchWorldCupFixtures = async (apiKey: string) => {
  const response = await fetch(`${API_BASE_URL}/fixtures?league=${WORLD_CUP_LEAGUE_ID}&season=${WORLD_CUP_SEASON}`, {
    headers: { "x-apisports-key": apiKey },
  });
  const fixtures = await response.json();

  if (!response.ok) throw new Error(`Fixtures request failed [${response.status}]: ${JSON.stringify(fixtures)}`);
  if (hasApiErrors(fixtures)) throw new Error(`API-Football returned errors: ${JSON.stringify(fixtures.errors)}`);

  return fixtures;
};

const calculatePoints = (prediction: any, homeScore: number, awayScore: number) => {
  if (prediction.predicted_home_score === homeScore && prediction.predicted_away_score === awayScore) return 3;
  return Math.sign(prediction.predicted_home_score - prediction.predicted_away_score) === Math.sign(homeScore - awayScore) ? 1 : 0;
};

const scorePredictionsForMatch = async (supabase: any, matchId: string, homeScore: number, awayScore: number) => {
  const { data: predictions, error } = await supabase
    .from("predictions")
    .select("id, predicted_home_score, predicted_away_score")
    .eq("match_id", matchId);
  if (error) throw error;

  let scored = 0;
  for (const prediction of predictions || []) {
    const points = calculatePoints(prediction, homeScore, awayScore);
    const { error: updateError } = await supabase.from("predictions").update({ points_awarded: points }).eq("id", prediction.id);
    if (updateError) throw updateError;
    scored++;
  }
  return scored;
};

const syncMatches = async (fixtures: any[]) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) throw new Error("Supabase service credentials are not configured");

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const sortedFixtures = [...fixtures].sort((a, b) => new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime());
  let fixturesSynced = 0;
  let predictionsScored = 0;

  const { data: existingMatches, error: existingError } = await supabase
    .from("matches")
    .select("id, match_number, api_fixture_id");
  if (existingError) throw existingError;

  const byFixtureId = new Map((existingMatches || []).filter((m: any) => m.api_fixture_id).map((m: any) => [m.api_fixture_id, m]));
  const byMatchNumber = new Map((existingMatches || []).map((m: any) => [m.match_number, m]));
  let nextMatchNumber = Math.max(0, ...(existingMatches || []).map((m: any) => m.match_number || 0)) + 1;

  for (const [index, fixture] of sortedFixtures.entries()) {
    const apiFixtureId = fixture?.fixture?.id;
    if (!apiFixtureId) continue;

    const round = fixture?.league?.round ?? null;
    const statusDetail = fixture?.fixture?.status?.short ?? "NS";
    const status = normalizeStatus(statusDetail);
    const matchNumber = index + 1;
    const existing = byFixtureId.get(apiFixtureId) || byMatchNumber.get(matchNumber);
    const homeScore = getScore(fixture, "home", status);
    const awayScore = getScore(fixture, "away", status);
    const row = {
      api_fixture_id: apiFixtureId,
      match_number: existing?.match_number ?? matchNumber ?? nextMatchNumber++,
      stage: getStage(round),
      group_label: getGroup(round),
      round_label: round,
      home_team: fixture?.teams?.home?.name || "TBD",
      away_team: fixture?.teams?.away?.name || "TBD",
      home_team_logo: fixture?.teams?.home?.logo ?? null,
      away_team_logo: fixture?.teams?.away?.logo ?? null,
      kickoff_utc: fixture?.fixture?.date,
      stadium: fixture?.fixture?.venue?.name ?? "",
      city: fixture?.fixture?.venue?.city ?? "",
      status,
      status_detail: statusDetail,
      home_score: homeScore,
      away_score: awayScore,
      last_synced_at: new Date().toISOString(),
    };

    const result = existing?.id
      ? await supabase.from("matches").update(row).eq("id", existing.id).select("id").single()
      : await supabase.from("matches").insert(row).select("id").single();
    if (result.error) throw result.error;

    fixturesSynced++;
    if (status === "finished" && homeScore !== null && awayScore !== null) {
      predictionsScored += await scorePredictionsForMatch(supabase, result.data.id, homeScore, awayScore);
    }
  }

  return { fixturesSynced, predictionsScored };
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "GET" && req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const apiKey = Deno.env.get("API_FOOTBALL_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API_FOOTBALL_KEY is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let action = "fixtures";
    if (req.method === "POST") {
      try {
        const body = await req.json();
        action = body?.action || action;
      } catch {
        action = "fixtures";
      }
    }

    if (action === "sync-matches") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const fixtures = await fetchWorldCupFixtures(apiKey);
    const responseBody: Record<string, unknown> = { fixtures, updatedAt: new Date().toISOString() };

    if (action === "sync-matches") {
      Object.assign(responseBody, await syncMatches(fixtures.response || []));
    }

    return new Response(JSON.stringify(responseBody), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("api-football-fixtures error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
