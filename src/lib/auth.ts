// src/lib/auth.ts
import { supabase } from "./supabase-client";

export type SupabaseUser = { id: string };

// Extract the Supabase user from a Bearer token on the Request
export async function getUserFromRequest(req: Request): Promise<SupabaseUser | null> {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return { id: data.user.id };
}

// Returns true if that user_id has at least one "active" subscription row
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const { count, error } = await supabase
    .from("subscriptions")
    .select("id", { head: true, count: "exact" })
    .eq("user_id", userId)
    .eq("status", "active");
  if (error) throw error;
  return (count ?? 0) > 0;
}
