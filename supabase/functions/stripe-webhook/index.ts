import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const maxMembersMap: Record<string, number> = {
  basico: 10,
  familiar: 20,
  grande: 99999,
};

Deno.serve(async (req) => {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new Response(JSON.stringify({ error: "Missing stripe-signature header" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
    apiVersion: "2024-06-20",
  });

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      Deno.env.get("STRIPE_WEBHOOK_SECRET")!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return new Response(JSON.stringify({ error: "Invalid signature" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const meta = session.metadata!;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const tier = meta.group_tier;
    const paymentId = (session.payment_intent as string) || session.id;

    // Idempotency: skip if this payment was already processed
    const { data: existing } = await supabase
      .from("groups")
      .select("id")
      .eq("stripe_payment_id", paymentId)
      .maybeSingle();

    if (existing) {
      console.log("Payment already processed, skipping:", paymentId);
      return new Response(JSON.stringify({ received: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data: group, error: groupError } = await supabase
      .from("groups")
      .insert({
        name: meta.group_name,
        description: meta.group_description || null,
        access_code: meta.group_access_code || null,
        tier,
        max_members: maxMembersMap[tier],
        admin_user_id: meta.user_id,
        stripe_payment_id: paymentId,
      })
      .select()
      .single();

    if (groupError) {
      console.error("Error creating group:", groupError);
      return new Response(JSON.stringify({ error: groupError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { error: memberError } = await supabase.from("group_members").insert({
      group_id: group.id,
      user_id: meta.user_id,
      status: "approved",
    });

    if (memberError) {
      console.error("Error adding admin as member:", memberError);
    }

    console.log("Group created successfully:", group.id);
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
