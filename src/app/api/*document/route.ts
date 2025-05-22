// src/app/api/document/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-client";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: Request) {
  // 1) Authenticate user
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2) Read ?id= from query string
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  // 3) Fetch that single document for this user
  const { data, error } = await supabase
    .from("documents")
    .select("id, user_id, filename, uploaded_at, summary, risks")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message || "Not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ document: data });
}
