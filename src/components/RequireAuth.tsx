"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSessionContext } from "@supabase/auth-helpers-react";

export default function RequireAuth({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session } = useSessionContext();
  const router = useRouter();

  useEffect(() => {
    if (!session) {
      router.replace("/auth");  // not logged in
    }
  }, [session, router]);

  // Once authenticated, you could also check paywall status here:
  // fetch("/api/documents?countOnly=true", …) and redirect to /pricing if needed

  if (!session) {
    return null; // or a spinner
  }
  return <>{children}</>;
}
