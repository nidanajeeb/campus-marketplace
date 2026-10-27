import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Recycle, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CATEGORIES, CATEGORY_ICONS } from "@/lib/categories";
import { listItems } from "@/lib/items";
import { ErrorState, ItemCard, ItemGridSkeleton } from "@/components/ItemCard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Campus Marketplace — Buy & sell used items on campus" },
      { name: "description", content: "Find affordable second-hand textbooks, calculators, drawing kits and lab supplies from students on your campus." },
      { property: "og:title", content: "Campus Marketplace — Buy & sell used items on campus" },
      { property: "og:description", content: "Affordable second-hand academic and personal items from fellow students." },
    ],
  }),
  component: Home,
});

export const itemsQuery = { queryKey: ["items"], queryFn: listItems };

function Home() {
  const { data, isLoading, error, refetch } = useQuery(itemsQuery);
  const available = data?.filter((i) => i.status === "available") ?? [];

  return (
    <>
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 md:grid-cols-[1.4fr_1fr] md:items-center md:py-14">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-accent">For students, by students</p>
            <h1 className="mt-2 text-3xl font-bold leading-tight md:text-5xl">
              Good Finds. Better Prices.
              <br />
              Campus Connections.
            </h1>
            <p className="mt-3 max-w-xl text-primary-foreground/75">
              Buy and sell used textbooks, calculators, drawing kits and lab supplies with students on your campus.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild variant="accent" size="lg">
                <Link to="/browse">
                  Explore Items <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
                <Link to="/sell">Sell an Item</Link>
              </Button>
            </div>
          </div>
          <ul className="grid gap-3 text-sm">
            {[
              { icon: Users, t: "Campus community", d: "Deal with students you can meet in person." },
              { icon: Recycle, t: "Reuse, reduce waste", d: "Give last semester's books a second life." },
              { icon: ShieldCheck, t: "No online payments", d: "Pay in person once you've seen the item." },
            ].map(({ icon: I, t, d }) => (
              <li key={t} className="flex gap-3 rounded-xl bg-primary-foreground/5 p-4">
                <I className="h-5 w-5 shrink-0 text-accent" />
                <div>
                  <p className="font-semibold">{t}</p>
                  <p className="text-primary-foreground/70">{d}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pt-8">
        <h2 className="text-lg font-semibold text-foreground">Shop by category</h2>
        <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {CATEGORIES.map((c) => {
            const Icon = CATEGORY_ICONS[c];
            return (
              <Link
                key={c}
                to="/browse"
                search={{ category: c }}
                className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 text-center text-sm font-medium text-foreground shadow-card transition hover:border-accent hover:shadow-card-hover"
              >
                <span className="grid h-10 w-10 place-items-center rounded-full bg-accent-soft text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                {c}
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pt-10">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Recently added</h2>
            <p className="text-sm text-muted-foreground">Fresh listings from your campus</p>
          </div>
          <Link to="/browse" className="text-sm font-semibold text-primary hover:underline">
            View all →
          </Link>
        </div>
        {isLoading ? (
          <ItemGridSkeleton />
        ) : error ? (
          <ErrorState message={(error as Error).message} onRetry={() => refetch()} />
        ) : available.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-10 text-center text-muted-foreground">
            No items listed yet. <Link to="/sell" className="font-semibold text-primary">Be the first to sell something.</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {available.slice(0, 8).map((i) => (
              <ItemCard key={i.itemId} item={i} />
            ))}
          </div>
        )}
        {data?.some((i) => i.isDemo) && (
          <p className="mt-4 text-xs text-muted-foreground">Listings marked "Demo" are sample data for demonstration, not real offers.</p>
        )}
      </section>
    </>
  );
}
