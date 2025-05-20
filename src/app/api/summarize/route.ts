// src/app/api/summarize/route.ts
import { NextResponse } from "next/server";
import { OpenAI } from "openai";
import pdfParse from "pdf-parse";

export const config = {
  api: {
    bodyParser: false, // we’ll handle FormData ourselves
  },
};

export async function POST(req: Request) {
  // 1) Pull the file out of the multipart FormData
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json(
      { error: "No file provided" },
      { status: 400 }
    );
  }

  // 2) Turn it into a Buffer and extract text
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const { text } = await pdfParse(buffer);

  // 3) Call OpenAI with your Corner Store Legal Summaries prompt
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const resp = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `
You are an expert contract analyst built for small and mid-sized businesses. 
Given any contract or official document—whether in real estate, healthcare, finance, public accounting, or other regulated industry—your job is to:

1. Produce a **one-page (≈300-word) executive summary** that highlights the key obligations, rights, and overall risk posture.
2. Identify the **top five highest-risk clauses**, pasting each clause verbatim along with its page number.
3. For every flagged clause, **cite publicly available official sources** (statutes, regulations, case law, industry guidance) to justify why it represents a breach or risk.
4. **Suggest potential blind-spots** the user may have overlooked (e.g., cross-jurisdictional issues, regulatory gaps, renewal traps, indemnity asymmetries).
5. Operate with zero-setup: assume the user has simply uploaded a PDF and expects a fully self-contained JSON response. 

Be concise, precise, and industry-agnostic in your analysis using a professional tone.
Return **only** valid JSON with two keys:
- \`summary\`: string
- \`risks\`: array of up to 5 objects \{ title: string; clause: string; page: number; citations: string[]; blindSpot: string \}
`
      },
      { role: "user", content: text },
    ],
  });

  // 4) Parse and return the structured JSON
  const payload = JSON.parse(resp.choices[0].message.content as string);
  return NextResponse.json(payload);
}
