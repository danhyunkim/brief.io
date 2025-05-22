// src/app/upload/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import RequireAuth from "@/components/RequireAuth";
import UploadPageContent from "./UploadPageContent";
import { useSessionContext } from "@supabase/auth-helpers-react";

function UploadPageWrapper() {
  const { session } = useSessionContext();
  const router = useRouter();

  useEffect(() => {
    if (!session) return;
    (async () => {
      const res = await fetch("/api/documents?countOnly=true", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const { count, paid } = await res.json() as { count: number; paid: boolean };

      if (count >= 1 && !paid) {
        router.replace("/pricing");
      }
    })();
  }, [session, router]);

  return <UploadPageContent />;
}

export default function UploadPage() {
  return (
    <RequireAuth>
      <UploadPageWrapper />
    </RequireAuth>
  );
}
