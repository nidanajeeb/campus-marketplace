import { Link, useLocation } from "@tanstack/react-router";
import { Loader2, Lock } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export function RequireAuth({ children, message }: { children: ReactNode; message: string }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading)
    return (
      <div className="grid min-h-[40vh] place-items-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  if (!user)
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-accent-soft text-primary"><Lock className="h-5 w-5" /></span>
        <h1 className="mt-4 text-xl font-semibold text-foreground">Sign in required</h1>
        <p className="mt-1 text-muted-foreground">{message}</p>
        <Button asChild className="mt-5"><Link to="/auth" search={{ redirect: location.pathname }}>Sign in or create account</Link></Button>
      </div>
    );
  return <>{children}</>;
}
