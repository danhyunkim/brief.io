// src/app/api/summarize/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-client";
import { OpenAI } from "openai";
import pdfParse from "pdf-parse";
import { Buffer } from "buffer";

type SupabaseUser = { id: string };

async function getUser(req: Request): Promise<SupabaseUser | null> {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return { id: data.user.id };
}

async function hasActiveSubscription(userId: string): Promise<boolean> {
  const { count, error } = await supabase
    .from("subscriptions")
    .select("id", { head: true, count: "exact" })
    .eq("user_id", userId)
    .eq("status", "active");
  if (error) throw new Error(error.message);
  return (count ?? 0) > 0;
}

export const runtime = "nodejs";
export const config = { api: { bodyParser: false } };

export async function POST(req: Request) {
  const user = await getUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { count, error: countErr } = await supabase
    .from("documents")
    .select("id", { head: true, count: "exact" })
    .eq("user_id", user.id);
  if (countErr) {
    return NextResponse.json({ error: countErr.message }, { status: 500 });
  }

  const paid = await hasActiveSubscription(user.id);
  if ((count ?? 0) >= 1 && !paid) {
    return NextResponse.json(
      { error: "Paywall: Free tier used. Please upgrade or pay." },
      { status: 402 }
    );
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const { text } = await pdfParse(buffer);

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  const resp = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `
You are Ironguard.io's expert contract analyst built for small and mid-sized businesses. 
Given any contract or official document—real estate, legal, lease, healthcare, finance, public accounting, or other regulated industry—your job is to:

1. Produce a one-page (≈300-word) executive summary highlighting obligations, rights, and risk posture.
2. Identify the top five highest-risk clauses, pasting each verbatim with its page number.
3. For each flagged clause, cite publicly available official sources (statutes, regulations, case law, industry guidance) to justify the risk.
4. Suggest potential blind-spots the user may have overlooked.
5. Operate with zero setup—assume a PDF upload and return a self-contained JSON response.

Return only valid JSON:
{
  summary: string,
  risks: Array<{
    title: string;
    clause: string;
    page: number;
    citations: string[];
    blindSpot: string;
  }>
}
        `,
      },
      { role: "user", content: text },
    ],
  });

  const payload = JSON.parse(
    resp.choices[0].message.content as string
  ) as { summary: string; risks: unknown[] };

  return NextResponse.json(payload);
}
