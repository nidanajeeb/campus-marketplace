import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays, Lock, Mail, Phone, Tag, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate, formatPrice, getContact, getItem } from "@/lib/items";
import { ErrorState, ItemImage, StatusBadge } from "@/components/ItemCard";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/items/$id")({
  head: () => ({
    meta: [
      { title: "Item details — Campus Marketplace" },
      { name: "description", content: "View the item's photo, description, price and seller on Campus Marketplace." },
      { property: "og:title", content: "Item details — Campus Marketplace" },
      { property: "og:description", content: "A used item listed by a student on Campus Marketplace." },
    ],
  }),
  component: ItemDetails,
});

function ItemDetails() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const { data: item, isLoading, error, refetch } = useQuery({ queryKey: ["item", id], queryFn: () => getItem(id) });
  const { data: contact } = useQuery({
    queryKey: ["contact", id, user?.id],
    queryFn: () => getContact(id),
    enabled: !!user && !!item,
  });

  if (isLoading)
    return (
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 md:grid-cols-2">
        <div className="aspect-square animate-pulse rounded-xl bg-muted" />
        <div className="space-y-3">
          <div className="h-8 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-6 w-1/4 animate-pulse rounded bg-muted" />
        </div>
      </div>
    );
  if (error) return <div className="mx-auto max-w-3xl px-4 py-10"><ErrorState message={(error as Error).message} onRetry={() => refetch()} /></div>;
  if (!item)
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-foreground">Listing not found</h1>
        <p className="mt-1 text-muted-foreground">It may have been removed by the seller.</p>
        <Button asChild variant="outline" className="mt-4"><Link to="/browse">Back to Browse</Link></Button>
      </div>
    );

  const isEmail = contact?.includes("@");
  const isOwner = user && item.sellerId === user.id;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link to="/browse" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to items
      </Link>
      <div className="grid gap-8 md:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
          <ItemImage item={item} className="aspect-square w-full" />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={item.status} />
            {item.isDemo && <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">Demo listing — not a real offer</span>}
          </div>
          <h1 className="mt-3 text-2xl font-bold text-foreground md:text-3xl">{item.itemName}</h1>
          <p className="mt-2 text-3xl font-bold text-primary">{formatPrice(item.price)}</p>

          <dl className="mt-5 grid gap-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground"><Tag className="h-4 w-4" /><dt className="sr-only">Category</dt><dd><Link to="/browse" search={{ category: item.category as never }} className="text-foreground hover:underline">{item.category}</Link></dd></div>
            <div className="flex items-center gap-2 text-muted-foreground"><User className="h-4 w-4" /><dt className="sr-only">Seller</dt><dd className="text-foreground">{item.sellerName}</dd></div>
            <div className="flex items-center gap-2 text-muted-foreground"><CalendarDays className="h-4 w-4" /><dt className="sr-only">Listed</dt><dd>Listed {formatDate(item.createdAt)}</dd></div>
          </dl>

          <h2 className="mt-6 font-semibold text-foreground">Description</h2>
          <p className="mt-1 whitespace-pre-line text-foreground/90">{item.description}</p>

          <div className="mt-6 rounded-xl border border-border bg-card p-4">
            <h2 className="font-semibold text-foreground">Contact seller</h2>
            {item.status === "sold" ? (
              <p className="mt-1 text-sm text-muted-foreground">This item has been sold and is no longer available.</p>
            ) : !user ? (
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground"><Lock className="h-4 w-4" /> Sign in to see the seller's contact details.</p>
                <Button asChild size="sm"><Link to="/auth" search={{ redirect: `/items/${item.itemId}` }}>Sign in</Link></Button>
              </div>
            ) : contact ? (
              <div className="mt-2 space-y-3">
                <p className="text-sm text-foreground">{contact}</p>
                {!item.isDemo && (
                  <Button asChild variant="accent">
                    <a href={isEmail ? `mailto:${encodeURIComponent(contact)}?subject=${encodeURIComponent(`Campus Marketplace: ${item.itemName}`)}` : `tel:${contact.replace(/[^\d+]/g, "")}`}>
                      {isEmail ? <Mail className="h-4 w-4" /> : <Phone className="h-4 w-4" />} Contact Seller
                    </a>
                  </Button>
                )}
              </div>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">No contact details available.</p>
            )}
            <p className="mt-3 text-xs text-muted-foreground">Payment and pickup are arranged directly between students. Campus Marketplace does not process payments.</p>
          </div>

          {isOwner && (
            <Button asChild variant="outline" className="mt-4"><Link to="/edit/$id" params={{ id: item.itemId }}>Edit this listing</Link></Button>
          )}
        </div>
      </div>
    </div>
  );
}
