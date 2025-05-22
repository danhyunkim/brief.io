"use client";
import { useEffect, useState } from "react";
import { useSession } from "@supabase/auth-helpers-react";
import type { DocumentRow } from "@/types";


export default function HistoryPage() {
  const session = useSession();
  const accessToken = session?.access_token || "";
  const [docs, setDocs] = useState<DocumentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDocs(): Promise<void> {
      const res = await fetch("/api/history", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      // Type cast the response!
      setDocs((data.documents as DocumentRow[]) || []);
      setLoading(false);
    }
    if (accessToken) fetchDocs();
  }, [accessToken]);

  return (
    <main className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-semibold mb-8">Document History</h1>
      {loading ? (
        <div className="text-muted-foreground">Loading…</div>
      ) : docs.length === 0 ? (
        <div className="text-muted-foreground">No documents yet.</div>
      ) : (
        <ul className="space-y-6">
          {docs.map((doc: DocumentRow) => (
            <li
              key={doc.id}
              className="p-4 bg-background border rounded-lg flex flex-col gap-1"
            >
              <span className="font-semibold">{doc.filename}</span>
              <span className="text-xs text-muted-foreground">
                Uploaded: {new Date(doc.uploaded_at).toLocaleString()}
              </span>
              <a
                href={`/upload/${doc.id}`}
                className="text-blue-600 hover:underline text-sm mt-1"
              >
                View summary & risks
              </a>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
