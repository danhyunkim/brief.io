import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-client";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: Request) {
  // 1) Authenticate user
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2) Fetch documents for this user, newest first
  const { data, error } = await supabase
    .from("documents")
    .select("id, filename, uploaded_at")
    .eq("user_id", user.id)
    .order("uploaded_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ documents: data });
}
