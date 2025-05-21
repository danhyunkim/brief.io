"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown, Loader2 } from "lucide-react";

export default function FeedbackButtons({
  documentId,
  accessToken,
}: {
  documentId: string;
  accessToken: string; // From Supabase session
}) {
  const [submitted, setSubmitted] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  const sendFeedback = async (liked: boolean) => {
    setLoading(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ documentId, liked }),
      });
      if (!res.ok) throw new Error();
      setSubmitted(liked);
    } catch {
      alert("Could not send feedback. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted !== null) {
    return (
      <div className="flex items-center gap-2 mt-6">
        <span className="text-green-600 font-semibold">
          {submitted ? "Thanks for your feedback!" : "Thanks — we’ll use that to make the next one better."}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 mt-6">
      <span className="text-muted-foreground mr-2">Was this summary helpful?</span>
      <Button
        variant="outline"
        size="icon"
        onClick={() => sendFeedback(true)}
        disabled={loading}
        className="transition hover:bg-green-100 hover:text-green-700"
        aria-label="Thumbs up"
      >
        {loading ? <Loader2 className="animate-spin" /> : <ThumbsUp className="h-5 w-5" />}
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={() => sendFeedback(false)}
        disabled={loading}
        className="transition hover:bg-red-100 hover:text-red-700"
        aria-label="Thumbs down"
      >
        {loading ? <Loader2 className="animate-spin" /> : <ThumbsDown className="h-5 w-5" />}
      </Button>
    </div>
  );
}
