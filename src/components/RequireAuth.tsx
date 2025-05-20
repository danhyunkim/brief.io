// src/components/RequireAuth.tsx
"use client";

import { useRouter } from "next/navigation";
import { useSession } from "@supabase/auth-helpers-react";
import { useEffect } from "react";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const session = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!session) router.replace("/auth");
  }, [session, router]);

  if (!session) return null; // or a spinner
  return <>{children}</>;
}
