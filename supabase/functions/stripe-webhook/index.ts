import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function verifyStripeSignature(payload: string, sigHeader: string, secret: string): Promise<boolean> {
  const parts = sigHeader.split(",");
  let timestamp = "";
  const signatures: string[] = [];

  for (const part of parts) {
    const [key, value] = part.split("=");
    if (key === "t") timestamp = value;
    if (key === "v1") signatures.push(value);
  }

  if (!timestamp || signatures.length === 0) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signatureBytes = await crypto.subtle.sign("HMAC", key, encoder.encode(signedPayload));
  const expectedSig = Array.from(new Uint8Array(signatureBytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return signatures.some((sig) => sig === expectedSig);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  const body = await req.text();
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

  const valid = await verifyStripeSignature(body, signature, webhookSecret);
  if (!valid) {
    console.error("Webhook signature verification failed");
    return new Response("Webhook signature verification failed", { status: 400 });
  }

  const event = JSON.parse(body);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const paymentId = session.id;
    const meta = session.metadata;

    // Idempotency check
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
        tier: meta.tier,
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
