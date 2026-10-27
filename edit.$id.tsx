import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ItemForm } from "@/components/ItemForm";
import { RequireAuth } from "@/components/RequireAuth";
import { useAuth } from "@/hooks/useAuth";
import { getContact, getItem, updateItem } from "@/lib/items";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/edit/$id")({
  head: () => ({
    meta: [
      { title: "Edit listing — Campus Marketplace" },
      { name: "description", content: "Update the details of your Campus Marketplace listing." },
      { property: "og:title", content: "Edit listing — Campus Marketplace" },
      { property: "og:description", content: "Update your listing." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-foreground">Edit listing</h1>
      <div className="mt-6 rounded-xl border border-border bg-card p-5 shadow-card md:p-8">
        <RequireAuth message="Sign in to edit your listings.">
          <EditForm />
        </RequireAuth>
      </div>
    </div>
  ),
});

function EditForm() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["edit", id, user?.id],
    queryFn: async () => {
      const item = await getItem(id);
      const contact = item ? await getContact(id) : null;
      return { item, contact };
    },
  });

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  const item = data?.item;
  // UI check only — the database policies also reject edits to listings you don't own.
  if (!item || item.sellerId !== user!.id)
    return (
      <div className="text-center">
        <p className="font-semibold text-foreground">You can't edit this listing</p>
        <p className="mt-1 text-sm text-muted-foreground">Only the student who posted it can make changes.</p>
        <Button asChild variant="outline" className="mt-4"><Link to="/my-listings">Go to My Listings</Link></Button>
      </div>
    );

  return (
    <ItemForm
      submitLabel="Save changes"
      initialImageUrl={item.imageUrl}
      initial={{
        itemName: item.itemName,
        category: item.category,
        price: String(item.price),
        description: item.description,
        sellerName: item.sellerName,
        sellerContact: data?.contact ?? "",
      }}
      onSubmit={async (values, image) => {
        await updateItem(user!.id, item, values, image);
        await qc.invalidateQueries();
        toast.success("Listing updated");
        navigate({ to: "/my-listings" });
      }}
    />
  );
}
