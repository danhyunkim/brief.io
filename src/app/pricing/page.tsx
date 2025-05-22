// src/app/pricing/page.tsx

"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { RiskFlag, DocumentRow } from "@/types";


export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);

  async function handleSubscribe(priceId: string) {
    setLoading(priceId);
    try {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      const { url } = await res.json();
      if (!url) throw new Error("No checkout URL returned");
      window.location.assign(url);
    } catch (err) {
      console.error(err);
      alert("Could not start checkout. Please try again.");
      setLoading(null);
    }
  }

  return (
    <main className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-semibold text-center">Choose Your Plan</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Pay-As-You-Go */}
        <section className="p-6 border rounded-lg space-y-4">
          <h2 className="text-2xl font-medium">Pay-As-You-Go</h2>
          <p className="text-3xl font-semibold">
            $25<span className="text-lg">/document</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Simply pay $25 per PDF to generate an executive summary and top-five
            risk-flag analysis—no monthly commitment.
          </p>
          <Button
            onClick={() =>
              handleSubscribe("price_1RQjqxKc7JtDH4pe1y9KUtlM")
            }
            disabled={loading !== null}
          >
            {loading === "price_1RQjqxKc7JtDH4pe1y9KUtlM"
              ? "Loading…"
              : "Get Started"}
          </Button>
        </section>

        {/* Starter */}
        <section className="p-6 border rounded-lg space-y-4">
          <h2 className="text-2xl font-medium">Starter</h2>
          <p className="text-3xl font-semibold">
            $499<span className="text-lg">/mo</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Ideal for growing SMBs: up to 20 contract, lease, or agreement
            summaries per month for a flat $499/mo. Each includes a concise
            1-page executive brief, five highest-risk clause citations (with
            page refs), and expert-curated best-practice guidance.
          </p>
          <Button
            onClick={() =>
              handleSubscribe("price_1RQjsHKc7JtDH4pez9oG5TuI")
            }
            disabled={loading !== null}
          >
            {loading === "price_1RQjsHKc7JtDH4pez9oG5TuI"
              ? "Loading…"
              : "Subscribe"}
          </Button>
        </section>

        {/* Scale */}
        <section className="p-6 border rounded-lg space-y-4">
          <h2 className="text-2xl font-medium">Scale</h2>
          <p className="text-3xl font-semibold">
            $999<span className="text-lg">/mo</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Scale your workflow with up to 60 document analyses monthly. At
            $999/mo, get everything in the Starter tier plus priority
            processing, deeper industry-specific blind-spot reporting, and
            extended analytics on clause trends across your portfolio.
          </p>
          <Button
            onClick={() =>
              handleSubscribe("price_1RQjsvKc7JtDH4petEd8STpB")
            }
            disabled={loading !== null}
          >
            {loading === "price_1RQjsvKc7JtDH4petEd8STpB"
              ? "Loading…"
              : "Subscribe"}
          </Button>
        </section>
      </div>
    </main>
  );
}
