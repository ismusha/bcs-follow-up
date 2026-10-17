import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Lock, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brand } from "@/components/AppShell";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Staff Login · Bethelehem Cleaning Service" },
      { name: "description", content: "Secure staff sign-in for the Bethelehem Cleaning Service management system." },
      { property: "og:title", content: "Staff Login · Bethelehem Cleaning Service" },
      { property: "og:description", content: "Secure staff sign-in for the cleaning management system." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) return setError("Enter your email and password.");
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) return setError("Incorrect email or password.");
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between bg-hero p-12 text-navy-foreground lg:flex">
        <Brand light />
        <div>
          <h1 className="text-4xl font-bold leading-tight">Every job, every cleaner,<br />perfectly on schedule.</h1>
          <p className="mt-4 max-w-md text-navy-foreground/80">The internal management system for Bethelehem Cleaning Service.</p>
        </div>
        <p className="flex items-center gap-2 text-sm text-navy-foreground/70"><ShieldCheck className="h-4 w-4" />Authorized staff only</p>
      </div>
      <div className="flex items-center justify-center p-6">
        <form onSubmit={onSubmit} className="w-full max-w-sm">
          <div className="mb-8 lg:hidden"><Brand /></div>
          <div className="mb-6 grid h-12 w-12 place-items-center rounded-xl bg-sky-soft text-primary"><Lock className="h-6 w-6" /></div>
          <h2 className="text-2xl font-bold">Staff sign in</h2>
          <p className="mt-1 text-sm text-muted-foreground">Use the account the company owner created for you.</p>
          <div className="mt-6 grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" size="lg" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
