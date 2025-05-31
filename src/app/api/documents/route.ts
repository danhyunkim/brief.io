import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-client";
import { getUserFromRequest } from "@/lib/auth";

interface DocumentInsert {
  filename: string;
  summary: string;
  risks: unknown[];
}

export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Count how many documents this user has
  const { count, error: countErr } = await supabase
    .from("documents")
    .select("id", { head: true, count: "exact" })
    .eq("user_id", user.id);
  if (countErr) {
    return NextResponse.json({ error: countErr.message }, { status: 500 });
  }

  // Check if the user has an active subscription
  const { count: subCount, error: subErr } = await supabase
    .from("subscriptions")
    .select("id", { head: true, count: "exact" })
    .eq("user_id", user.id)
    .eq("status", "active");
  if (subErr) {
    return NextResponse.json({ error: subErr.message }, { status: 500 });
  }

  const paid = (subCount ?? 0) > 0;
  return NextResponse.json({ count: count ?? 0, paid });
}

export async function POST(req: Request) {
  try {
    const user = await getUserFromRequest(req);
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

    // Check subscription status
    const { count: subCount, error: subErr } = await supabase
      .from("subscriptions")
      .select("id", { head: true, count: "exact" })
      .eq("user_id", user.id)
      .eq("status", "active");
    if (subErr) {
      return NextResponse.json({ error: subErr.message }, { status: 500 });
    }
    const paid = (subCount ?? 0) > 0;

    // Enforce one free doc, then paywall
    if ((docCount ?? 0) >= 1 && !paid) {
      return NextResponse.json(
        { error: "Paywall: Free tier used. Please upgrade or pay." },
        { status: 402 }
      );
    }

    // Validate request body
    const body = (await req.json()) as DocumentInsert;
    const { filename, summary, risks } = body;
    if (!filename || !summary || !risks) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Insert the document record
    const { data, error: insertErr } = await supabase
      .from("documents")
      .insert({
        user_id: user.id,
        filename,
        summary,
        risks,
      })
      .select()
      .single();
    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    return NextResponse.json({ document: data });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
