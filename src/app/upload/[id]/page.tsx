// src/app/upload/[id]/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import FeedbackButtons from "@/components/FeedbackButtons";
import { useSession } from "@supabase/auth-helpers-react";
import { DocumentRow, RiskFlag } from "@/types";

export default function DocumentDetailPage() {
  const params = useParams();
  const docId = params.id as string;
  const session = useSession();
  const accessToken = session?.access_token || "";

  const [doc, setDoc] = useState<DocumentRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    async function fetchDoc() {
      const res = await fetch(`/api/document?id=${docId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const { document } = await res.json();
      setDoc(document as DocumentRow);
      setLoading(false);
    }
    fetchDoc();
  }, [accessToken, docId]);

  if (loading) return <div className="p-8">Loading…</div>;
  if (!doc) return <div className="p-8">Not found.</div>;

  return (
    <main className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-semibold mb-6">{doc.filename}</h1>
      <section className="mb-8 p-6 bg-muted rounded-lg shadow-sm">
        <h2 className="text-xl font-medium mb-2">Executive Summary</h2>
        <p className="text-base text-foreground">{doc.summary}</p>
      </section>
      {/* Render risks if they exist */}
      {doc.risks && Array.isArray(doc.risks) && (
        <section className="mb-10">
          <h2 className="text-lg font-medium mb-2">Top 5 Risk Flags</h2>
          <ul className="space-y-4">
            {doc?.risks.map((risk: RiskFlag, idx: number) => (
              <li key={idx} className="p-4 bg-background border rounded-lg">
                <div className="font-semibold">{risk.title}</div>
                <div className="text-sm mt-1 mb-2 text-muted-foreground">
                  <span className="font-mono bg-muted px-1 py-0.5 rounded">{risk.clause}</span>
                  <span className="ml-2 text-xs">Page {risk.page}</span>
                </div>
                <div className="text-xs text-accent-foreground">
                  Cites: {risk.citations?.join(", ") || "None"}
                </div>
                <div className="text-xs italic mt-1 text-warning-foreground">
                  Blind spot: {risk.blindSpot}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
      <FeedbackButtons documentId={doc.id} accessToken={accessToken} />
      <a href="/history" className="inline-block mt-6 text-blue-600 hover:underline">
        Back to History
      </a>
    </main>
  );
}
