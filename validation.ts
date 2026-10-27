import { z } from "zod";
import { CATEGORIES } from "./categories";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const itemSchema = z.object({
  itemName: z.string().trim().min(2, "Item name must be at least 2 characters").max(100, "Max 100 characters"),
  category: z.enum(CATEGORIES, { errorMap: () => ({ message: "Choose a category" }) }),
  price: z.coerce
    .number({ invalid_type_error: "Enter a valid price" })
    .min(0, "Price cannot be negative")
    .max(1000000, "Price looks too high"),
  description: z.string().trim().min(10, "Describe the item in at least 10 characters").max(1000, "Max 1000 characters"),
  sellerName: z.string().trim().min(2, "Enter your name").max(60, "Max 60 characters"),
  sellerContact: z.string().trim().min(5, "Enter a phone number or email").max(120, "Max 120 characters"),
});

export type ItemInput = z.infer<typeof itemSchema>;

export function validateImage(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return "Only JPG, PNG or WebP images are allowed";
  if (file.size > MAX_IMAGE_BYTES) return "Image must be 5 MB or smaller";
  return null;
}

/** Lowercase, trim and collapse repeated spaces so searches behave sensibly. */
export function normalizeQuery(q: string) {
  return q.trim().replace(/\s+/g, " ").toLowerCase();
}
