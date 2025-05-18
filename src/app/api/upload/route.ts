// src/app/api/upload/route.ts
import { NextResponse } from "next/server";

export const config = {
  api: {
    bodyParser: false, // we’ll handle form data ourselves
  },
};

export async function POST(req: Request) {
  // 1. Grab the File from the incoming FormData
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // 2. Read it into a Buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // 3. (Optional) parse text in‐house:
  // const { text } = await pdfParse(buffer);
  // const summaryPayload = await callOpenAI(text);
  // return NextResponse.json(summaryPayload);

  // 4. Proxy to your external Summarizer API
  const summarizerUrl = process.env.NEXT_PUBLIC_SUMMARY_ENDPOINT!;
  const outboundForm = new FormData();
  outboundForm.append("file", new Blob([buffer]), file.name);

  const resp = await fetch(summarizerUrl, {
    method: "POST",
    body: outboundForm,
  });
  if (!resp.ok) {
    return NextResponse.json(
      { error: `Summarizer error: ${resp.status}` },
      { status: 502 }
    );
  }
  const json = await resp.json();
  return NextResponse.json(json);
}
