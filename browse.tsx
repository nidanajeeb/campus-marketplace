import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Search, SearchX, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CATEGORIES } from "@/lib/categories";
import { filterItems, listItems } from "@/lib/items";
import { ErrorState, ItemCard, ItemGridSkeleton } from "@/components/ItemCard";

const searchSchema = z.object({
  q: z.string().optional().catch(undefined),
  category: z.enum(CATEGORIES).optional().catch(undefined),
  min: z.number().min(0).optional().catch(undefined),
  max: z.number().min(0).optional().catch(undefined),
  sort: z.enum(["newest", "price-asc", "price-desc"]).optional().catch(undefined),
  status: z.enum(["available", "sold", "all"]).optional().catch(undefined),
});

export const Route = createFileRoute("/browse")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Browse Items — Campus Marketplace" },
      { name: "description", content: "Search and filter second-hand textbooks, electronics, engineering tools and more by category and price." },
      { property: "og:title", content: "Browse Items — Campus Marketplace" },
      { property: "og:description", content: "Search and filter used items listed by students on campus." },
    ],
  }),
  component: Browse,
});

const ctrl = "h-10 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-ring/30";

function Browse() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/browse" });
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["items"], queryFn: listItems });
  const [q, setQ] = useState(search.q ?? "");
  const [min, setMin] = useState(search.min?.toString() ?? "");
  const [max, setMax] = useState(search.max?.toString() ?? "");

  useEffect(() => setQ(search.q ?? ""), [search.q]);

  const update = (patch: Partial<z.infer<typeof searchSchema>>) =>
    navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true });

  // Debounce text inputs so results update as you type.
  useEffect(() => {
    const t = setTimeout(() => {
      const minN = min === "" ? undefined : Math.max(0, Number(min));
      const maxN = max === "" ? undefined : Math.max(0, Number(max));
      update({
        q: q.trim() || undefined,
        min: Number.isFinite(minN) ? minN : undefined,
        max: Number.isFinite(maxN) ? maxN : undefined,
      });
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, min, max]);

  const results = data ? filterItems(data, search) : [];
  const hasFilters = !!(search.q || search.category || search.min != null || search.max != null || search.sort || search.status);
  const priceError = search.min != null && search.max != null && search.min > search.max;

  const reset = () => {
    setQ("");
    setMin("");
    setMax("");
    navigate({ search: {}, replace: true });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold text-foreground">Browse Items</h1>

      <div className="mt-4 grid gap-3 rounded-xl border border-border bg-card p-4 shadow-card md:grid-cols-12">
        <div className="relative md:col-span-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or category" aria-label="Search" className={`${ctrl} pl-9`} />
        </div>
        <select aria-label="Category" className={`${ctrl} md:col-span-2`} value={search.category ?? ""} onChange={(e) => update({ category: (e.target.value || undefined) as never })}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <input aria-label="Minimum price" type="number" min={0} placeholder="Min ₹" value={min} onChange={(e) => setMin(e.target.value)} className={`${ctrl} md:col-span-1`} />
        <input aria-label="Maximum price" type="number" min={0} placeholder="Max ₹" value={max} onChange={(e) => setMax(e.target.value)} className={`${ctrl} md:col-span-1`} />
        <select aria-label="Sort" className={`${ctrl} md:col-span-2`} value={search.sort ?? "newest"} onChange={(e) => update({ sort: e.target.value === "newest" ? undefined : (e.target.value as never) })}>
          <option value="newest">Newest first</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
        </select>
        <select aria-label="Availability" className={`${ctrl} md:col-span-2`} value={search.status ?? "available"} onChange={(e) => update({ status: e.target.value === "available" ? undefined : (e.target.value as never) })}>
          <option value="available">Available only</option>
          <option value="sold">Sold only</option>
          <option value="all">All items</option>
        </select>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {isLoading ? "Loading…" : `${results.length} ${results.length === 1 ? "item" : "items"} found`}
          {search.category && <> in <span className="font-medium text-foreground">{search.category}</span></>}
        </p>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={reset}>
            <X className="h-4 w-4" /> Reset filters
          </Button>
        )}
      </div>
      {priceError && <p className="mt-1 text-sm text-destructive">Minimum price is higher than maximum price.</p>}

      <div className="mt-4">
        {isLoading ? (
          <ItemGridSkeleton />
        ) : error ? (
          <ErrorState message={(error as Error).message} onRetry={() => refetch()} />
        ) : results.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <SearchX className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 font-semibold text-foreground">No matching items</p>
            <p className="mt-1 text-sm text-muted-foreground">Try a different search or clear your filters.</p>
            <div className="mt-4 flex justify-center gap-2">
              <Button variant="outline" size="sm" onClick={reset}>Reset filters</Button>
              <Button asChild variant="accent" size="sm"><Link to="/sell">Sell an item</Link></Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {results.map((i) => (
              <ItemCard key={i.itemId} item={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
