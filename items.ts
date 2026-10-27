import { supabase } from "@/integrations/supabase/client";
import { normalizeQuery, type ItemInput } from "./validation";
import textbook from "@/assets/demo-textbook.jpg";
import calculator from "@/assets/demo-calculator.jpg";
import drawingkit from "@/assets/demo-drawingkit.jpg";
import labcoat from "@/assets/demo-labcoat.jpg";
import programming from "@/assets/demo-programming.jpg";
import laptopacc from "@/assets/demo-laptopacc.jpg";
import instruments from "@/assets/demo-instruments.jpg";
import stationery from "@/assets/demo-stationery.jpg";

const DEMO_IMAGES: Record<string, string> = {
  "demo:textbook": textbook,
  "demo:calculator": calculator,
  "demo:drawingkit": drawingkit,
  "demo:labcoat": labcoat,
  "demo:programming": programming,
  "demo:laptopacc": laptopacc,
  "demo:instruments": instruments,
  "demo:stationery": stationery,
};

const BUCKET = "item-images";

export type Item = {
  itemId: string;
  itemName: string;
  category: string;
  price: number;
  description: string;
  sellerName: string;
  imagePath: string | null;
  imageUrl: string | null;
  createdAt: string;
  status: "available" | "sold";
  sellerId: string | null;
  isDemo: boolean;
};

type Row = {
  item_id: string;
  item_name: string;
  category: string;
  price: number;
  description: string;
  seller_name: string;
  image_path: string | null;
  created_at: string;
  status: string;
  seller_id: string | null;
  is_demo: boolean;
};

async function toItems(rows: Row[]): Promise<Item[]> {
  const storagePaths = rows.map((r) => r.image_path).filter((p): p is string => !!p && !p.startsWith("demo:"));
  const signed: Record<string, string> = {};
  if (storagePaths.length) {
    const { data } = await supabase.storage.from(BUCKET).createSignedUrls(storagePaths, 60 * 60);
    data?.forEach((d) => {
      if (d.path && d.signedUrl) signed[d.path] = d.signedUrl;
    });
  }
  return rows.map((r) => ({
    itemId: r.item_id,
    itemName: r.item_name,
    category: r.category,
    price: Number(r.price),
    description: r.description,
    sellerName: r.seller_name,
    imagePath: r.image_path,
    imageUrl: r.image_path ? (DEMO_IMAGES[r.image_path] ?? signed[r.image_path] ?? null) : null,
    createdAt: r.created_at,
    status: r.status === "sold" ? "sold" : "available",
    sellerId: r.seller_id,
    isDemo: r.is_demo,
  }));
}

export async function listItems(): Promise<Item[]> {
  const { data, error } = await supabase.from("items").select("*").order("created_at", { ascending: false });
  if (error) throw new Error("Could not load listings. Please check your connection and try again.");
  return toItems(data as Row[]);
}

export async function listMyItems(userId: string): Promise<Item[]> {
  const { data, error } = await supabase
    .from("items")
    .select("*")
    .eq("seller_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error("Could not load your listings.");
  return toItems(data as Row[]);
}

export async function getItem(id: string): Promise<Item | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data, error } = await supabase.from("items").select("*").eq("item_id", id).maybeSingle();
  if (error) throw new Error("Could not load this listing.");
  if (!data) return null;
  return (await toItems([data as Row]))[0] ?? null;
}

/** Contact details are only readable by signed-in students (enforced by database policies). */
export async function getContact(id: string): Promise<string | null> {
  const { data } = await supabase.from("item_contacts").select("seller_contact").eq("item_id", id).maybeSingle();
  return data?.seller_contact ?? null;
}

async function uploadImage(userId: string, itemId: string, file: File) {
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  // Safe, generated filename: <user>/<item>-<random>.<ext> — the original filename is never used.
  const path = `${userId}/${itemId}-${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type });
  if (error) throw new Error("Image upload failed. Please try a different photo.");
  return path;
}

export async function createItem(userId: string, input: ItemInput, image: File | null) {
  const itemId = crypto.randomUUID();
  const imagePath = image ? await uploadImage(userId, itemId, image) : null;
  const { error } = await supabase.from("items").insert({
    item_id: itemId,
    item_name: input.itemName,
    category: input.category,
    price: input.price,
    description: input.description,
    seller_name: input.sellerName,
    image_path: imagePath,
    seller_id: userId,
  });
  if (error) throw new Error("Could not save the listing. Please check the form and try again.");
  const { error: cErr } = await supabase.from("item_contacts").insert({ item_id: itemId, seller_contact: input.sellerContact });
  if (cErr) throw new Error("Listing saved, but contact details could not be stored.");
  return itemId;
}

export async function updateItem(userId: string, item: Item, input: ItemInput, image: File | null) {
  let imagePath = item.imagePath;
  if (image) {
    imagePath = await uploadImage(userId, item.itemId, image);
    if (item.imagePath && !item.imagePath.startsWith("demo:")) {
      await supabase.storage.from(BUCKET).remove([item.imagePath]);
    }
  }
  const { data, error } = await supabase
    .from("items")
    .update({
      item_name: input.itemName,
      category: input.category,
      price: input.price,
      description: input.description,
      seller_name: input.sellerName,
      image_path: imagePath,
    })
    .eq("item_id", item.itemId)
    .select("item_id");
  if (error || !data?.length) throw new Error("You can only edit your own listings.");
  await supabase.from("item_contacts").upsert({ item_id: item.itemId, seller_contact: input.sellerContact });
}

export async function setItemStatus(itemId: string, status: "available" | "sold") {
  const { data, error } = await supabase.from("items").update({ status }).eq("item_id", itemId).select("item_id");
  if (error || !data?.length) throw new Error("You can only update your own listings.");
}

export async function deleteItem(item: Item) {
  const { data, error } = await supabase.from("items").delete().eq("item_id", item.itemId).select("item_id");
  if (error || !data?.length) throw new Error("You can only delete your own listings.");
  if (item.imagePath && !item.imagePath.startsWith("demo:")) {
    await supabase.storage.from(BUCKET).remove([item.imagePath]);
  }
}

export async function resetDemoData() {
  const { error } = await supabase.rpc("reset_demo_items");
  if (error) throw new Error("Could not reset demo data.");
}

export type Filters = {
  q?: string | undefined;
  category?: string | undefined;
  min?: number | undefined;
  max?: number | undefined;
  sort?: "newest" | "price-asc" | "price-desc" | undefined;
  status?: "available" | "sold" | "all" | undefined;
};

export function filterItems(items: Item[], f: Filters): Item[] {
  const q = normalizeQuery(f.q ?? "");
  const status = f.status ?? "available";
  const out = items.filter((i) => {
    if (status !== "all" && i.status !== status) return false;
    if (f.category && i.category !== f.category) return false;
    if (f.min != null && i.price < f.min) return false;
    if (f.max != null && i.price > f.max) return false;
    if (q) {
      const hay = `${i.itemName} ${i.category}`.toLowerCase();
      if (!q.split(" ").every((w) => hay.includes(w))) return false;
    }
    return true;
  });
  const sort = f.sort ?? "newest";
  out.sort((a, b) =>
    sort === "price-asc" ? a.price - b.price : sort === "price-desc" ? b.price - a.price : b.createdAt.localeCompare(a.createdAt),
  );
  return out;
}

export const formatPrice = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
