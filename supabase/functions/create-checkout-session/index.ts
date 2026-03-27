import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import Stripe from "https://esm.sh/stripe@17.7.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const priceMap: Record<string, number> = {
  basico: 4900,   // $49 MXN in centavos
  familiar: 9900, // $99 MXN
  grande: 19900,  // $199 MXN
};

const tierLabels: Record<string, string> = {
  basico: "Básico (hasta 10 miembros)",
  familiar: "Familiar (hasta 20 miembros)",
  grande: "Grande (miembros ilimitados)",
};

const maxMembersMap: Record<string, number> = {
  basico: 10,
  familiar: 20,
  grande: 99999,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2024-12-18.acacia",
    });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse and validate input
    const body = await req.json();
    const { name, description, access_code, tier, success_url, cancel_url } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Nombre del grupo requerido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!tier || !priceMap[tier]) {
      return new Response(JSON.stringify({ error: "Plan inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (access_code && (access_code.length < 4 || access_code.length > 8 || !/^[a-zA-Z0-9]+$/.test(access_code))) {
      return new Response(JSON.stringify({ error: "Código de acceso inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      currency: "mxn",
      line_items: [
        {
          price_data: {
            currency: "mxn",
            product_data: {
              name: `Quiniela – ${tierLabels[tier]}`,
              description: `Grupo: ${name.trim()}`,
            },
            unit_amount: priceMap[tier],
          },
          quantity: 1,
        },
      ],
      metadata: {
        user_id: user.id,
        group_name: name.trim(),
        group_description: description?.trim() || "",
        access_code: access_code?.trim() || "",
        tier,
        max_members: String(maxMembersMap[tier]),
      },
      success_url: success_url || `${req.headers.get("origin")}/my-groups?payment=success`,
      cancel_url: cancel_url || `${req.headers.get("origin")}/my-groups?payment=cancelled`,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Checkout error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
