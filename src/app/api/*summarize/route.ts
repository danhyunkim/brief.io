// src/app/api/summarize/route.ts
import { NextResponse } from "next/server";
import { OpenAI } from "openai";

export const runtime = "nodejs";

export const config = {
  api: {
    bodyParser: false, // we’ll parse FormData ourselves
  },
};

export async function POST(req: Request) {
  // 1) Parse the incoming multipart/form-data
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // 2) Dynamically load pdf-parse so its tests don’t run at build time
  const { default: pdfParse } = await import("pdf-parse");
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const { text } = await pdfParse(buffer);

  // 3) Call OpenAI
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

  // 4) Parse & return
  const payload = JSON.parse(resp.choices[0].message.content as string);
  return NextResponse.json(payload);
}
