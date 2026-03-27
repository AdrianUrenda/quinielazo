import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import Stripe from "https://esm.sh/stripe@17.7.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
    apiVersion: "2024-12-18.acacia",
  });

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  const body = await req.text();
  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      Deno.env.get("STRIPE_WEBHOOK_SECRET")!
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    // Idempotency: check if group already created for this payment
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const paymentId = session.id;
    const meta = session.metadata!;

    // Check idempotency
    const { data: existing } = await supabase
      .from("groups")
      .select("id")
      .eq("stripe_payment_id", paymentId)
      .maybeSingle();

    if (existing) {
      console.log(`Group already created for payment ${paymentId}, skipping.`);
      return new Response(JSON.stringify({ received: true }), { status: 200 });
    }

    // Create the group
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .insert({
        name: meta.group_name,
        description: meta.group_description || null,
        access_code: meta.access_code || null,
        tier: meta.tier as "basico" | "familiar" | "grande",
        max_members: parseInt(meta.max_members, 10),
        admin_user_id: meta.user_id,
        stripe_payment_id: paymentId,
      })
      .select()
      .single();

    if (groupError) {
      console.error("Error creating group:", groupError);
      return new Response(JSON.stringify({ error: groupError.message }), { status: 500 });
    }

    // Add admin as approved member
    const { error: memberError } = await supabase.from("group_members").insert({
      group_id: group.id,
      user_id: meta.user_id,
      status: "approved",
    });

    if (memberError) {
      console.error("Error adding admin as member:", memberError);
    }

    console.log(`Group "${meta.group_name}" created successfully (${group.id}) for payment ${paymentId}`);
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
