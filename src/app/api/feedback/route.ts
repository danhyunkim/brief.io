// src/app/api/feedback/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-client";

// Utility to get user from Supabase session (cookie-based)
async function getUser(req: Request) {
  const accessToken = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!accessToken) return null;

  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data.user) return null;
  return data.user;
}

export async function POST(req: Request) {
  try {
    const { documentId, liked } = await req.json();

    if (!documentId || typeof liked !== "boolean") {
      return NextResponse.json(
        { error: "documentId and liked (boolean) are required." },
        { status: 400 }
      );
    }

    // Get user from Authorization header (Bearer token)
    const user = await getUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Insert feedback
    const { error } = await supabase.from("feedback").insert({
      user_id: user.id,
      document_id: documentId,
      liked,
    });

    if (error) {
      return NextResponse.json(
        { error: "Database error", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: "Server error", details: String(err) },
      { status: 500 }
    );
  }
}
