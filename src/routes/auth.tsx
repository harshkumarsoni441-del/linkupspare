import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/Layout";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-store";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — Maruti Genuine Parts" }] }),
  component: AuthPage,
});

function AuthPage() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (user) nav({ to: "/" }); }, [user, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "signup" && !/^[A-Za-z0-9]{6,}$/.test(password)) {
      toast.error("Password must be at least 6 characters and contain only letters (A–Z, a–z) and numbers.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { name }, emailRedirectTo: `${window.location.origin}/` },
        });
        if (error) throw error;
        toast.success("Account created. You can now sign in.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
        nav({ to: "/" });
      }
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    } finally { setBusy(false); }
  };

  return (
    <SiteLayout>
      <div className="container mx-auto max-w-md px-4 py-16">
        <div className="glass-card p-6">
          <h1 className="text-2xl font-bold">{mode === "signin" ? "Sign in" : "Create account"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{mode === "signin" ? "Welcome back." : "Start ordering genuine parts."}</p>
          <form onSubmit={submit} className="mt-6 space-y-3">
            {mode === "signup" && (
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" required className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm" />
            )}
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" required className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm" />
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" minLength={6} required className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm" />
            <button disabled={busy} className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">
              {busy ? "Please wait…" : (mode === "signin" ? "Sign in" : "Create account")}
            </button>
          </form>
          <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="mt-4 w-full text-center text-xs text-muted-foreground hover:text-foreground">
            {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </SiteLayout>
  );
}
