// src/app/auth/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSessionContext } from "@supabase/auth-helpers-react";
import { Loader2 } from "lucide-react";

function parseHashParams(hash: string): Record<string, string> {
  return hash
    .replace(/^#/, "")
    .split("&")
    .map((kv) => kv.split("="))
    .reduce((acc, [k, v]) => ({ ...acc, [k]: decodeURIComponent(v) }), {});
}

export default function AuthPage() {
  const { supabaseClient } = useSessionContext();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 1) Try the modern ?code= callback
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) {
      supabaseClient.auth
        .exchangeCodeForSession(code)
        .then((res: { error: { message: string } | null }) => {
          if (res.error) setError(res.error.message);
          else router.replace("/upload");
        });
      return;
    }

    // 2) Fallback: legacy #access_token=... callback
    const hash = window.location.hash;
    if (hash.includes("access_token=")) {
      const { access_token, refresh_token } = parseHashParams(hash);
      if (access_token && refresh_token) {
        supabaseClient.auth
          .setSession({ access_token, refresh_token })
          .then((res: { error: { message: string } | null }) => {
            if (res.error) setError(res.error.message);
            else router.replace("/upload");
          });
      } else {
        setError("Invalid auth data in URL hash.");
      }
      return;
    }

    setError("No auth code or token found in URL.");
  }, [supabaseClient, router]);

  return (
    <main className="flex flex-col items-center justify-center h-screen">
      {error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <div className="flex items-center gap-2">
          <Loader2 className="animate-spin" />
          Authenticating…
        </div>
      )}
    </main>
  );
}
