// src/components/AuthForm.tsx
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function AuthForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ 
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth`,
      },
     });

    setLoading(false);
    if (error) setMessage(`Error: ${error.message}`);
    else setMessage("Check your email for the login link!");
  };

  return (
    <div className="max-w-sm mx-auto space-y-4 py-10">
      <h1 className="text-2xl font-semibold">Sign In / Sign Up</h1>
      <Input
        type="email"
        placeholder="your@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Button onClick={handleLogin} disabled={loading}>
        {loading ? "Sending..." : "Send Magic Link"}
      </Button>
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  );
}
