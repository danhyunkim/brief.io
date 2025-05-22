// src/app/auth/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSessionContext } from "@supabase/auth-helpers-react";
import { Loader2 } from "lucide-react";

function parseHashParams(hash: string) {
  // Convert "#access_token=xxx&expires_in=3600&refresh_token=yyy" into an object
  return hash
    .replace(/^#/, "")
    .split("&")
    .map((kv) => kv.split("="))
    .reduce((acc, [key, val]) => ({ ...acc, [key]: val }), {} as Record<string, string>);
}

export default function AuthPage() {
  const { supabaseClient } = useSessionContext();
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 1. Check for ?code= param (modern approach)
    const code = params.get("code");
    if (code) {
      supabaseClient.auth
        .exchangeCodeForSession(code)
        .then((result: { error: { message: string } | null }) => {
          if (result.error) setError(result.error.message);
          else router.replace("/upload");
        });
      return;
    }

    // 2. Else, check for #access_token in URL hash (legacy, fallback)
    const hash = window.location.hash;
    if (hash && hash.includes("access_token=")) {
      const { access_token, refresh_token, expires_in, token_type } = parseHashParams(hash);

      if (access_token && refresh_token && expires_in && token_type) {
        supabaseClient.auth
          .setSession({
            access_token,
            refresh_token,
          })
          .then(({ error }: { error: { message: string } | null }) => {
            if (error) setError(error.message);
            else router.replace("/upload");
          });
      } else {
        setError("Invalid auth callback data in URL hash.");
      }
      return;
    }

    setError("No valid auth code or access token found in URL.");
  }, [supabaseClient, params, router]);

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
