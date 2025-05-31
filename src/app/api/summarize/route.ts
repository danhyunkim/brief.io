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
  // → Get user
  const user = await getUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // → Paywall guard: count docs
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

  // → Handle file upload & parsing
  const formData = await req.formData();
  const file = formData.get("file") as Blob | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const { text } = await pdfParse(buffer);

  // → Call OpenAI
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OpenAI API key is missing or empty." },
      { status: 500 }
    );
  }
  const openai = new OpenAI({ apiKey });

  const resp = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `
You are **Ironguard.io’s AI Contract Analyst**, purpose-built for small- and medium-sized businesses (SMBs, 5–200 employees).
Your mission: distill complex documents into actionable insight with audit-ready citations—zero setup, zero hallucinations.

––––– Scope of Supported Documents –––––
• Commercial contracts (MSAs, SOWs, SaaS, distribution, franchising)
• Real-estate leases, purchase agreements, easements
• Healthcare BAAs, provider agreements, HIPAA forms
• Financial services (lending, factoring, ISO, merchant cash-advance)
• Public-accounting engagement letters, SOC reports, tax prep agreements
• Any other legally binding document supplied as text

––––– REQUIRED OUTPUT (must be strict JSON, **no extra keys or prose**) –––––
{
  summary: <~300-word executive brief>,
  risks: [
    {
      title: <concise risk label>,
      clause: <verbatim clause text>,
      page: <page number, 1-based>,
      citations: [<official source 1>, <official source 2>, …],
      blindSpot: <1-sentence mitigation or overlooked angle>
    }
  ]
}

––––– Generation Rules –––––
1. **Executive Summary (summary)**
   • 3-4 short paragraphs, plain English, max ≈300 words.  
   • Cover parties, term/termination, payment, IP/licensing, liability caps, governing law, and overall risk posture (low/medium/high).  
   • Write for busy in-house counsel or an operations VP—punchy, jargon-light.

2. **Risk Extraction (risks[])**
   • Parse entire document; surface **the five clauses with highest downside for the SMB-side** (auto-renew traps, unlimited indemnity, unilateral termination, broad IP assignment, data-privacy gaps, etc.).  
   • **Paste each clause verbatim**—no paraphrasing—trim to ≤120 words if needed with ellipsis (\"…\") but keep meaning.  
   • Record its **page** (count sequentially from 1).

3. **Citations**
   • Minimum one authoritative source each: statute (e.g., UCC § 2-207), regulation (HIPAA 45 CFR 164.308), seminal case (Hadley v. Baxendale), or industry guidance (NIST SP 800-171).  
   • Use short form: \"UCC §2-207\", \"HIPAA 45 CFR 164.308\", \"Hadley v. Baxendale, 9 Ex 341 (1854)\".

4. **Blind-Spot Advice**
   • One forward-looking sentence: hidden renewal notice windows, cross-border tax exposure, conflicting governing-law combos, missing cyber-insurance, etc.  
   • Avoid generic tips; tailor to clause context and industry.

5. **Quality & Safety**
   • Absolutely NO fictitious citations or page numbers—verify truthfulness.  
   • If document text is unreadable, return a single-key JSON: \`{"error":"Unable to extract text"}\`.  
   • Never leak internal chain-of-thought.

Begin.
        `,
      },
      { role: "user", content: text },
    ],
  });

  // → Parse & return
  const payload = JSON.parse(
    resp.choices[0].message.content as string
  ) as { summary: string; risks: unknown[] };

  return NextResponse.json(payload);
}
