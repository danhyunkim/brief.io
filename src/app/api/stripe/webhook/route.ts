// src/app/api/stripe/webhook/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabase } from "@/lib/supabase-client";

export const config = { api: { bodyParser: false } };

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    // 1. Read raw body & header
    const buf = await req.arrayBuffer();
    const signature = req.headers.get("stripe-signature")!;

    // 2. Verify & parse the event
    const event = stripe.webhooks.constructEvent(
      Buffer.from(buf),
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    // 3. Handle the event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id;
      if (userId) {
        await supabase
          .from("subscriptions")
          .insert({ user_id: userId, session_id: session.id });
      }
    } else {
      console.log(`Unhandled event type: ${event.type}`);
    }

  } catch (err: unknown) {
    console.error("⚠️  Webhook verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // 4. Always acknowledge Stripe
  return NextResponse.json({ received: true });
}
