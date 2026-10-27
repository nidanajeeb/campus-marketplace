import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ItemForm } from "@/components/ItemForm";
import { RequireAuth } from "@/components/RequireAuth";
import { useAuth } from "@/hooks/useAuth";
import { createItem } from "@/lib/items";

export const Route = createFileRoute("/sell")({
  head: () => ({
    meta: [
      { title: "Sell an Item — Campus Marketplace" },
      { name: "description", content: "List your used textbook, calculator or supplies for students on your campus." },
      { property: "og:title", content: "Sell an Item — Campus Marketplace" },
      { property: "og:description", content: "Post a listing with a photo and price in minutes." },
    ],
  }),
  component: Sell,
});

function Sell() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-foreground">Sell an Item</h1>
      <p className="mt-1 text-muted-foreground">Add a clear photo and honest description — buyers will contact you directly.</p>
      <div className="mt-6 rounded-xl border border-border bg-card p-5 shadow-card md:p-8">
        <RequireAuth message="Create a free account so you can manage your listings later.">
          <SellForm />
        </RequireAuth>
      </div>
    </div>
  );
}

function SellForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  return (
    <ItemForm
      submitLabel="Submit Listing"
      onSubmit={async (data, image) => {
        const id = await createItem(user!.id, data, image);
        await qc.invalidateQueries({ queryKey: ["items"] });
        toast.success("Listing published!", { description: "Your item is now visible in the marketplace." });
        navigate({ to: "/items/$id", params: { id } });
      }}
    />
  );
}

export { Link };
