import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // Manual score update + automatic point calculation
    if (action === "update-score") {
      const body = await req.json();
      const { matchId, homeScore, awayScore } = body;

      if (!matchId || homeScore === undefined || awayScore === undefined) {
        return new Response(
          JSON.stringify({ error: "matchId, homeScore, awayScore required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update match to finished with scores
      const { error: updateErr } = await supabase
        .from("demo_matches")
        .update({
          status: "finished",
          home_score: homeScore,
          away_score: awayScore,
          last_synced_at: new Date().toISOString(),
        })
        .eq("id", matchId);

      if (updateErr) throw updateErr;

      // Score predictions for this match
      const { data: preds } = await supabase
        .from("demo_predictions")
        .select("id, predicted_home_score, predicted_away_score")
        .eq("demo_match_id", matchId);

      let scored = 0;
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

        scored++;
      }

      return new Response(
        JSON.stringify({ message: "Score updated", predictionsScored: scored }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "reset") {
      await supabase
        .from("demo_predictions")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");

      // Reset all matches back to upcoming
      await supabase
        .from("demo_matches")
        .update({ status: "upcoming", home_score: null, away_score: null })
        .neq("id", "00000000-0000-0000-0000-000000000000");

      return new Response(
        JSON.stringify({ message: "Demo reset complete" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action. Use: update-score, reset" }),
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
