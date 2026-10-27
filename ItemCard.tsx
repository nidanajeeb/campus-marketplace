import { Link } from "@tanstack/react-router";
import { ImageOff } from "lucide-react";
import { useState } from "react";
import { formatDate, formatPrice, type Item } from "@/lib/items";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ItemImage({ item, className }: { item: Item; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (!item.imageUrl || failed) {
    return (
      <div className={cn("grid place-items-center bg-muted text-muted-foreground", className)}>
        <div className="flex flex-col items-center gap-1 text-xs">
          <ImageOff className="h-7 w-7" />
          No photo
        </div>
      </div>
    );
  }
  return (
    <img
      src={item.imageUrl}
      alt={item.itemName}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn("object-cover", className)}
    />
  );
}

export function StatusBadge({ status }: { status: Item["status"] }) {
  return status === "sold" ? (
    <span className="rounded-full bg-sold px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">Sold</span>
  ) : (
    <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-semibold text-primary">Available</span>
  );
}

export function ItemCard({ item }: { item: Item }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover">
      <Link to="/items/$id" params={{ id: item.itemId }} className="relative block aspect-square overflow-hidden">
        <ItemImage item={item} className={cn("h-full w-full transition duration-300 group-hover:scale-[1.03]", item.status === "sold" && "opacity-60 grayscale")} />
        <div className="absolute left-3 top-3 flex gap-1.5">
          {item.status === "sold" && <StatusBadge status="sold" />}
          {item.isDemo && <span className="rounded-full bg-card/90 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">Demo</span>}
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{item.category}</p>
        <h3 className="line-clamp-2 font-semibold leading-snug text-foreground">{item.itemName}</h3>
        <p className="mt-1 text-lg font-bold text-primary">{formatPrice(item.price)}</p>
        <p className="text-xs text-muted-foreground">
          {item.sellerName} · {formatDate(item.createdAt)}
        </p>
        <Button asChild variant="outline" size="sm" className="mt-3">
          <Link to="/items/$id" params={{ id: item.itemId }}>View Details</Link>
        </Button>
      </div>
    </article>
  );
}

export function ItemGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="aspect-square animate-pulse bg-muted" />
          <div className="space-y-2 p-4">
            <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
            <div className="h-4 w-4/5 animate-pulse rounded bg-muted" />
            <div className="h-5 w-1/4 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-xl border border-border bg-card p-8 text-center">
      <p className="font-semibold text-foreground">Something went wrong</p>
      <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
