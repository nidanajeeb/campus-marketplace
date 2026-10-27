import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Pencil, Plus, RotateCcw, Trash2, Undo2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RequireAuth } from "@/components/RequireAuth";
import { ErrorState, ItemImage, StatusBadge } from "@/components/ItemCard";
import { useAuth } from "@/hooks/useAuth";
import { deleteItem, formatDate, formatPrice, listMyItems, resetDemoData, setItemStatus, type Item } from "@/lib/items";

export const Route = createFileRoute("/my-listings")({
  head: () => ({
    meta: [
      { title: "My Listings — Campus Marketplace" },
      { name: "description", content: "Manage, edit, mark as sold or delete your Campus Marketplace listings." },
      { property: "og:title", content: "My Listings — Campus Marketplace" },
      { property: "og:description", content: "Manage your listings." },
    ],
  }),
  component: () => (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <RequireAuth message="Sign in to see and manage the items you've posted.">
        <MyListings />
      </RequireAuth>
    </div>
  ),
});

function MyListings() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [toDelete, setToDelete] = useState<Item | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["my-items", user!.id], queryFn: () => listMyItems(user!.id) });

  const refresh = () => qc.invalidateQueries();

  const status = useMutation({
    mutationFn: (v: { item: Item; status: "available" | "sold" }) => setItemStatus(v.item.itemId, v.status),
    onSuccess: (_d, v) => { toast.success(v.status === "sold" ? "Marked as sold" : "Marked as available"); refresh(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: (item: Item) => deleteItem(item),
    onSuccess: () => { toast.success("Listing deleted"); refresh(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const reset = useMutation({
    mutationFn: resetDemoData,
    onSuccess: () => { toast.success("Demo listings restored"); refresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Listings</h1>
          <p className="text-sm text-muted-foreground">Signed in as {user!.email}</p>
        </div>
        <Button asChild variant="accent"><Link to="/sell"><Plus className="h-4 w-4" /> New listing</Link></Button>
      </div>

      <div className="mt-6 space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />)
        ) : error ? (
          <ErrorState message={(error as Error).message} onRetry={() => refetch()} />
        ) : !data?.length ? (
          <div className="rounded-xl border border-border bg-card p-10 text-center">
            <p className="font-semibold text-foreground">You haven't listed anything yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Turn last semester's books into cash.</p>
            <Button asChild variant="accent" className="mt-4"><Link to="/sell">Sell an Item</Link></Button>
          </div>
        ) : (
          data.map((item) => (
            <div key={item.itemId} className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-card sm:flex-row sm:items-center">
              <Link to="/items/$id" params={{ id: item.itemId }} className="shrink-0">
                <ItemImage item={item} className="h-24 w-24 rounded-lg" />
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2"><StatusBadge status={item.status} /><span className="text-xs text-muted-foreground">{item.category} · {formatDate(item.createdAt)}</span></div>
                <Link to="/items/$id" params={{ id: item.itemId }} className="mt-1 block truncate font-semibold text-foreground hover:underline">{item.itemName}</Link>
                <p className="font-bold text-primary">{formatPrice(item.price)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm"><Link to="/edit/$id" params={{ id: item.itemId }}><Pencil className="h-4 w-4" /> Edit</Link></Button>
                {item.status === "available" ? (
                  <Button variant="outline" size="sm" disabled={status.isPending} onClick={() => status.mutate({ item, status: "sold" })}><CheckCircle2 className="h-4 w-4" /> Mark as sold</Button>
                ) : (
                  <Button variant="outline" size="sm" disabled={status.isPending} onClick={() => status.mutate({ item, status: "available" })}><Undo2 className="h-4 w-4" /> Relist</Button>
                )}
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setToDelete(item)}><Trash2 className="h-4 w-4" /> Delete</Button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-10 rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Demo data</p>
        <p className="mt-1">The marketplace includes sample listings marked "Demo". Restore them to their original state at any time — your own listings are not affected.</p>
        <Button variant="outline" size="sm" className="mt-3" disabled={reset.isPending} onClick={() => setConfirmReset(true)}><RotateCcw className="h-4 w-4" /> Reset demo data</Button>
      </div>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this listing?</AlertDialogTitle>
            <AlertDialogDescription>"{toDelete?.itemName}" and its photo will be permanently removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => toDelete && del.mutate(toDelete)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmReset} onOpenChange={setConfirmReset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset demo data?</AlertDialogTitle>
            <AlertDialogDescription>All sample listings will be restored to their original state.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => reset.mutate()}>Reset</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
