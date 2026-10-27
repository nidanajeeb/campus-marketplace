import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/auth")({
  validateSearch: z.object({ redirect: z.string().optional().catch(undefined) }),
  head: () => ({
    meta: [
      { title: "Sign in — Campus Marketplace" },
      { name: "description", content: "Sign in or create a Campus Marketplace account to sell and manage items." },
      { property: "og:title", content: "Sign in — Campus Marketplace" },
      { property: "og:description", content: "Sign in to Campus Marketplace." },
    ],
  }),
  component: AuthPage,
});

const creds = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
});

const inputCls = "w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-ring/30";

function AuthPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const safeRedirect = redirect && redirect.startsWith("/") && !redirect.startsWith("//") ? redirect : "/my-listings";

  useEffect(() => {
    if (user) navigate({ to: safeRedirect });
  }, [user, navigate, safeRedirect]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    const p = creds.safeParse({ email, password });
    if (!p.success) return setError(p.error.issues[0]?.message ?? "Invalid input");
    setBusy(true);
    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword(p.data);
      if (error) setError(error.message === "Invalid login credentials" ? "Wrong email or password." : error.message);
      else toast.success("Welcome back!");
    } else {
      const { data, error } = await supabase.auth.signUp({
        ...p.data,
        options: { emailRedirectTo: `${window.location.origin}${safeRedirect}` },
      });
      if (error) setError(error.message);
      else if (!data.session) setInfo("Check your inbox to confirm your email, then sign in.");
    }
    setBusy(false);
  };

  return (
    <div className="mx-auto max-w-sm px-4 py-12">
      <div className="rounded-xl border border-border bg-card p-6 shadow-card">
        <h1 className="text-xl font-bold text-foreground">{mode === "signin" ? "Sign in" : "Create your account"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Needed to sell items, manage listings and see seller contacts.</p>
        <form onSubmit={submit} className="mt-5 space-y-3" noValidate>
          <input className={inputCls} type="email" placeholder="College email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className={inputCls} type="password" placeholder="Password (min 8 characters)" autoComplete={mode === "signin" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <p className="text-sm text-destructive">{error}</p>}
          {info && <p className="rounded-lg bg-accent-soft px-3 py-2 text-sm text-primary">{info}</p>}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>
        <button className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null); setInfo(null); }}>
          {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
