const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const API_BASE_URL = "https://v3.football.api-sports.io";
const WORLD_CUP_LEAGUE_ID = "1";
const WORLD_CUP_SEASON = "2026";

const hasApiErrors = (payload: { errors?: unknown }) => {
  if (!payload?.errors) return false;
  if (Array.isArray(payload.errors)) return payload.errors.length > 0;
  return Object.keys(payload.errors as Record<string, unknown>).length > 0;
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

    const response = await fetch(
      `${API_BASE_URL}/fixtures?league=${WORLD_CUP_LEAGUE_ID}&season=${WORLD_CUP_SEASON}`,
      { headers: { "x-apisports-key": apiKey } }
    );
    const fixtures = await response.json();

    if (!response.ok) {
      throw new Error(`Fixtures request failed [${response.status}]: ${JSON.stringify(fixtures)}`);
    }

    if (hasApiErrors(fixtures)) {
      throw new Error(`API-Football returned errors: ${JSON.stringify(fixtures.errors)}`);
    }

    return new Response(JSON.stringify({ fixtures, updatedAt: new Date().toISOString() }), {
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