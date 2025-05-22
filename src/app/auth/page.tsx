// src/app/auth/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSessionContext } from "@supabase/auth-helpers-react";
import { Loader2 } from "lucide-react";
import { AuthForm } from "@/components/AuthForm";

function parseHashParams(hash: string): Record<string, string> {
  return hash
    .replace(/^#/, "")
    .split("&")
    .map(kv => kv.split("="))
    .reduce((acc, [k, v]) => ({ ...acc, [k]: decodeURIComponent(v) }), {});
}

export default function AuthPage() {
  const { supabaseClient, session } = useSessionContext();
  const router = useRouter();
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If already signed in, skip
    if (session) {
      router.replace("/upload");
      return;
    }

    // 1) Handle ?code= callback
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    if (code) {
      supabaseClient.auth
        .exchangeCodeForSession(code)
        .then(({ error }) => {
          if (error) setError(error.message);
          else router.replace("/upload");
        })
        .finally(() => setBusy(false));
      return;
    }

    // 2) Handle #access_token= callback
    const hash = window.location.hash;
    if (hash.includes("access_token=")) {
      const { access_token, refresh_token } = parseHashParams(hash);
      if (access_token && refresh_token) {
        supabaseClient.auth
          .setSession({ access_token, refresh_token })
          .then(({ error }) => {
            if (error) setError(error.message);
            else router.replace("/upload");
          })
          .finally(() => setBusy(false));
      } else {
        setError("Invalid auth data in URL hash.");
        setBusy(false);
      }
      return;
    }

    // 3) No code or token → show form
    setBusy(false);
  }, [supabaseClient, session, router]);

  if (busy) {
    return (
      <main className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin mr-2" /> Authenticating…
      </main>
    );
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4">
      {error && <div className="text-red-600 mb-4">{error}</div>}
      <AuthForm />
    </main>
  );
}
