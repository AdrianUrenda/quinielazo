import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const priceMap: Record<string, number> = {
  basico: 4900,
  familiar: 9900,
  grande: 19900,
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
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY")!;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

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

    // Use Stripe REST API directly to avoid esm.sh/Deno compatibility issues
    const sessionPayload = {
      "payment_method_types[]": "card",
      mode: "payment",
      currency: "mxn",
      "line_items[0][price_data][currency]": "mxn",
      "line_items[0][price_data][product_data][name]": `Quiniela – ${tierLabels[tier]}`,
      "line_items[0][price_data][product_data][description]": `Grupo: ${name.trim()}`,
      "line_items[0][price_data][unit_amount]": String(priceMap[tier]),
      "line_items[0][quantity]": "1",
      "metadata[user_id]": user.id,
      "metadata[group_name]": name.trim(),
      "metadata[group_description]": description?.trim() || "",
      "metadata[access_code]": access_code?.trim() || "",
      "metadata[tier]": tier,
      "metadata[max_members]": String(maxMembersMap[tier]),
      success_url: success_url || `${req.headers.get("origin")}/groups?payment=success`,
      cancel_url: cancel_url || `${req.headers.get("origin")}/groups?payment=cancelled`,
    };

    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(sessionPayload)) {
      params.append(key, value);
    }

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const session = await stripeRes.json();

    if (!stripeRes.ok) {
      console.error("Stripe error:", session);
      throw new Error(session.error?.message || "Error de Stripe");
    }

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
