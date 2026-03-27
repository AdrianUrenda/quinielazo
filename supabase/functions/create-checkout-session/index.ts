import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const tierPrices: Record<string, number> = {
  basico: 4900,   // $49 MXN in centavos
  familiar: 9900, // $99 MXN in centavos
  grande: 19900,  // $199 MXN in centavos
};

const tierLabels: Record<string, string> = {
  basico: "Plan Básico – Hasta 10 miembros",
  familiar: "Plan Familiar – Hasta 20 miembros",
  grande: "Plan Grande – Miembros ilimitados",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the user's JWT
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { name, description, tier, access_code } = await req.json();

    if (!name || !tier || !tierPrices[tier]) {
      return new Response(JSON.stringify({ error: "Nombre y plan son requeridos" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2024-06-20",
    });

    const origin = req.headers.get("origin") || "https://quinielazo.link";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "mxn",
            product_data: {
              name: `Quinielazo – ${tierLabels[tier]}`,
              description: `Grupo: ${name}`,
            },
            unit_amount: tierPrices[tier],
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/groups?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/groups`,
      metadata: {
        user_id: user.id,
        group_name: name,
        group_description: description || "",
        group_tier: tier,
        group_access_code: access_code || "",
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("create-checkout-session error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
