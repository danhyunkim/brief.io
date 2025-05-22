// src/app/upload/UploadPageContent.tsx
"use client";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { UploadCloud, Loader2 } from "lucide-react";
import FeedbackButtons from "@/components/FeedbackButtons";
import { useSession } from "@supabase/auth-helpers-react";
import { RiskFlag, DocumentRow } from "@/types";



export default function UploadPageContent() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [risks, setRisks] = useState<RiskFlag[]>([]);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get Supabase session for access token
  const session = useSession();
  const accessToken = session?.access_token || "";

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setError(null);
    }
  };

  // Handle file upload and summary fetch
  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a PDF to upload.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // 1. Analyze PDF via summarize API
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("/api/summarize", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to analyze document.");
      const data = await res.json();

      // 2. Store document in Supabase via /api/documents
      const saveRes = await fetch("/api/documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          filename: selectedFile.name,
          summary: data.summary,
          risks: data.risks,
        }),
      });
      const savedDoc = await saveRes.json();
      if (savedDoc.document) {
        setSummary(savedDoc.document.summary);
        setRisks(savedDoc.document.risks);
        setDocumentId(savedDoc.document.id); // Use for feedback, history, etc.
      } else {
        throw new Error(savedDoc.error || "Could not save document.");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Upload failed. Try again.";
      setError(message);
    } finally {
      setLoading(false);
}
  };

  return (
    <main className="max-w-2xl mx-auto px-6 py-12">
      {/* Upload UI */}
      {!summary && (
        <section className="flex flex-col items-center gap-4 p-8 bg-background border rounded-xl shadow-sm mb-8">
          <label
            htmlFor="pdf-upload"
            className="flex flex-col items-center justify-center cursor-pointer"
          >
            <UploadCloud className="h-10 w-10 text-blue-600 mb-2" />
            <span className="font-medium mb-1">
              {selectedFile ? selectedFile.name : "Click to select or drag in a PDF"}
            </span>
            <input
              ref={fileInputRef}
              id="pdf-upload"
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
          <Button
            onClick={() => {
              if (fileInputRef.current) fileInputRef.current.click();
            }}
            variant="outline"
            disabled={loading}
          >
            Choose File
          </Button>
          <Button
            className="w-full"
            onClick={handleUpload}
            disabled={!selectedFile || loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing…
              </>
            ) : (
              "Analyze PDF"
            )}
          </Button>
          {error && <div className="text-red-600 mt-2">{error}</div>}
        </section>
      )}

      {/* Show summary and risks after upload */}
      {summary && (
        <>
          <section className="mb-8 p-6 bg-muted rounded-lg shadow-sm">
            <h2 className="text-xl font-medium mb-2">Executive Summary</h2>
            <p className="text-base text-foreground">{summary}</p>
          </section>
          <section className="mb-10">
            <h2 className="text-lg font-medium mb-2">Top 5 Risk Flags</h2>
            <ul className="space-y-4">
              {risks.map((risk: RiskFlag, idx: number) => (
                <li key={idx} className="p-4 bg-background border rounded-lg">
                  <div className="font-semibold">{risk.title}</div>
                  <div className="text-sm mt-1 mb-2 text-muted-foreground">
                    <span className="font-mono bg-muted px-1 py-0.5 rounded">{risk.clause}</span>
                    <span className="ml-2 text-xs">Page {risk.page}</span>
                  </div>
                  <div className="text-xs text-accent-foreground">
                    Citations: {risk.citations?.join(", ") || "None"}
                  </div>
                  <div className="text-xs italic mt-1 text-warning-foreground">
                    Potential blind spot: {risk.blindSpot}
                  </div>
                </li>
              ))}
            </ul>
          </section>
          {/* Feedback Buttons */}
          {documentId && accessToken && (
            <FeedbackButtons documentId={documentId} accessToken={accessToken} />
          )}
          {/* History Link */}
          <a
            href="/history"
            className="inline-block mt-8 text-blue-600 hover:underline font-medium"
          >
            View My Document History
          </a>
        </>
      )}
    </main>
  );
}
