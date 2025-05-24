// src/app/api/documents/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-client";

// Extract user from Bearer token
async function getUser(req: Request) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

// Check if user has an active subscription
async function hasActiveSubscription(userId: string) {
  const { count, error } = await supabase
    .from("subscriptions")
    .select("id", { head: true })
    .eq("user_id", userId)
    .eq("status", "active");
  if (error) throw new Error(error.message);
  return (count || 0) > 0;
}

export async function GET(req: Request) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { count, error } = await supabase
    .from("documents")
    .select("id", { head: true, count: "exact" })
    .eq("user_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const paid = await hasActiveSubscription(user.id);
  return NextResponse.json({ count: count ?? 0, paid });
}

export async function POST(req: Request) {
  try {
    const user = await getUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Count how many docs they've already created
    const { count: docCount, error: countErr } = await supabase
      .from("documents")
      .select("id", { head: true, count: "exact" })
      .eq("user_id", user.id);
    if (countErr) {
      return NextResponse.json({ error: countErr.message }, { status: 500 });
    }

    const paid = await hasActiveSubscription(user.id);

    // Enforce one free doc, then paywall
    if ((docCount || 0) >= 1 && !paid) {
      return NextResponse.json(
        { error: "Paywall: Free tier used. Please upgrade or pay." },
        { status: 402 }
      );
    }

    // Validate request body
    const { filename, summary, risks } = await req.json();
    if (!filename || !summary || !risks) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Insert the document record
    const { data, error } = await supabase
      .from("documents")
      .insert({
        user_id: user.id,
        filename,
        summary,
        risks,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ document: data });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
