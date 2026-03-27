import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const API_BASE = "https://v3.football.api-sports.io";
const LEAGUE_ID = 262;
const SEASON = 2025;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const apiKey = Deno.env.get("API_FOOTBALL_KEY");

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "API_FOOTBALL_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify JWT from request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    if (action === "sync-fixtures") {
      const apiUrl = `${API_BASE}/fixtures?league=${LEAGUE_ID}&season=${SEASON}&status=NS`;
      console.log("Fetching fixtures from:", apiUrl);
      const resp = await fetch(apiUrl, { headers: { "x-apisports-key": apiKey } });
      const data = await resp.json();
      console.log("API response errors:", JSON.stringify(data.errors));
      console.log("API response results:", data.results, "paging:", JSON.stringify(data.paging));
      const fixtures = data.response || [];

      const rows = fixtures.map((f: any) => ({
        api_fixture_id: f.fixture.id,
        home_team: f.teams.home.name,
        away_team: f.teams.away.name,
        home_team_logo: f.teams.home.logo,
        away_team_logo: f.teams.away.logo,
        kickoff_utc: f.fixture.date,
        stadium: f.fixture.venue?.name || "",
        city: f.fixture.venue?.city || "",
        status: "upcoming",
        last_synced_at: new Date().toISOString(),
      }));

      if (rows.length > 0) {
        const { error } = await supabase
          .from("demo_matches")
          .upsert(rows, { onConflict: "api_fixture_id", ignoreDuplicates: false });
        if (error) throw error;
      }

      return new Response(
        JSON.stringify({ synced: rows.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "sync-results") {
      // Get matches that should have finished (kickoff + 120 min < now) but still upcoming
      const { data: pendingMatches, error: fetchErr } = await supabase
        .from("demo_matches")
        .select("id, api_fixture_id, kickoff_utc")
        .in("status", ["upcoming", "live"]);
      if (fetchErr) throw fetchErr;

      const now = Date.now();
      const toCheck = (pendingMatches || []).filter((m) => {
        const kickoff = new Date(m.kickoff_utc).getTime();
        return now > kickoff + 105 * 60 * 1000;
      });

      if (toCheck.length === 0) {
        return new Response(
          JSON.stringify({ message: "No matches to check", scored: 0 }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Fetch finished fixtures
      const today = new Date().toISOString().split("T")[0];
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
      const resp = await fetch(
        `${API_BASE}/fixtures?league=${LEAGUE_ID}&season=${SEASON}&status=FT&from=${weekAgo}&to=${today}`,
        { headers: { "x-apisports-key": apiKey } }
      );
      const data = await resp.json();
      const finished = data.response || [];

      const finishedMap = new Map<number, any>();
      finished.forEach((f: any) => finishedMap.set(f.fixture.id, f));

      let scored = 0;

      for (const match of toCheck) {
        const result = finishedMap.get(match.api_fixture_id);
        if (!result) continue;

        const homeScore = result.goals.home;
        const awayScore = result.goals.away;

        // Update match
        await supabase
          .from("demo_matches")
          .update({
            status: "finished",
            home_score: homeScore,
            away_score: awayScore,
            last_synced_at: new Date().toISOString(),
          })
          .eq("id", match.id);

        // Score predictions
        const { data: preds } = await supabase
          .from("demo_predictions")
          .select("id, predicted_home_score, predicted_away_score")
          .eq("demo_match_id", match.id);

        for (const pred of preds || []) {
          const actualOutcome = Math.sign(homeScore - awayScore);
          const predictedOutcome = Math.sign(
            pred.predicted_home_score - pred.predicted_away_score
          );

          let points = 0;
          if (
            pred.predicted_home_score === homeScore &&
            pred.predicted_away_score === awayScore
          ) {
            points = 3;
          } else if (predictedOutcome === actualOutcome) {
            points = 1;
          }

          await supabase
            .from("demo_predictions")
            .update({ points_awarded: points })
            .eq("id", pred.id);
        }

        scored++;
      }

      return new Response(
        JSON.stringify({ scored }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "sync-live") {
      const resp = await fetch(
        `${API_BASE}/fixtures?league=${LEAGUE_ID}&live=all`,
        { headers: { "x-apisports-key": apiKey } }
      );
      const data = await resp.json();
      const live = data.response || [];

      for (const f of live) {
        await supabase
          .from("demo_matches")
          .update({
            status: "live",
            home_score: f.goals.home,
            away_score: f.goals.away,
            last_synced_at: new Date().toISOString(),
          })
          .eq("api_fixture_id", f.fixture.id);
      }

      return new Response(
        JSON.stringify({ live: live.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "reset") {
      // Reset all predictions points
      await supabase
        .from("demo_predictions")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");

      return new Response(
        JSON.stringify({ message: "Demo predictions cleared" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action. Use: sync-fixtures, sync-results, sync-live, reset" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("demo-sync error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
