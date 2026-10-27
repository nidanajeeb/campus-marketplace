import { Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Menu, Search, ShoppingBag, X, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/browse", label: "Browse Items" },
  { to: "/sell", label: "Sell an Item" },
  { to: "/my-listings", label: "My Listings" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    setOpen(false);
    navigate({ to: "/browse", search: { q: q.trim() || undefined } });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
        <Link to="/" className="flex shrink-0 items-center gap-2 font-bold text-primary">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
            <ShoppingBag className="h-5 w-5" />
          </span>
          <span className="hidden sm:inline">Campus Marketplace</span>
        </Link>

        <form onSubmit={onSearch} className="relative hidden flex-1 md:block md:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search textbooks, calculators, lab coats…"
            aria-label="Search items"
            className="h-10 w-full rounded-full border border-input bg-background pl-9 pr-4 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-ring/30"
          />
        </form>

        <nav className="ml-auto hidden items-center gap-1 lg:flex">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: n.to === "/" }}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
              activeProps={{ className: "text-foreground bg-muted" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-2 lg:ml-2 lg:flex">
          {user ? (
            <Button variant="ghost" size="sm" onClick={signOut} title={user.email ?? ""}>
              <LogOut className="h-4 w-4" /> Sign out
            </Button>
          ) : (
            <Button asChild variant="default" size="sm">
              <Link to="/auth">
                <User className="h-4 w-4" /> Sign in
              </Link>
            </Button>
          )}
        </div>

        <button
          className="ml-auto rounded-md p-2 text-foreground lg:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-card px-4 pb-4 lg:hidden">
          <form onSubmit={onSearch} className="relative mt-3 md:hidden">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search items"
              aria-label="Search items"
              className="h-10 w-full rounded-full border border-input bg-background pl-9 pr-4 text-sm outline-none focus:border-accent"
            />
          </form>
          <nav className="mt-2 flex flex-col">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
              >
                {n.label}
              </Link>
            ))}
            {user ? (
              <button onClick={() => { signOut(); setOpen(false); }} className="rounded-md px-3 py-2.5 text-left text-sm font-medium hover:bg-muted">
                Sign out ({user.email})
              </button>
            ) : (
              <Link to="/auth" onClick={() => setOpen(false)} className="rounded-md px-3 py-2.5 text-sm font-medium text-accent-foreground hover:bg-muted">
                Sign in / Create account
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-card">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-8 text-sm text-muted-foreground md:flex-row md:justify-between">
        <p>
          <span className="font-semibold text-foreground">Campus Marketplace</span> — buy and sell used items within your campus.
        </p>
        <p>Student project · No online payments — meet on campus and pay in person.</p>
      </div>
    </footer>
  );
}
