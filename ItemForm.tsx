import { useEffect, useState, type FormEvent } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CATEGORIES } from "@/lib/categories";
import { ALLOWED_IMAGE_TYPES, itemSchema, validateImage, type ItemInput } from "@/lib/validation";

type Values = Record<keyof ItemInput, string>;
const EMPTY: Values = { itemName: "", category: "", price: "", description: "", sellerName: "", sellerContact: "" };

const inputCls =
  "w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-ring/30 aria-[invalid=true]:border-destructive";

function Field({ label, error, children }: { label: string; error?: string | undefined; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-foreground">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-destructive">{error}</span>}
    </label>
  );
}

export function ItemForm({
  initial,
  initialImageUrl,
  submitLabel,
  onSubmit,
}: {
  initial?: Partial<Values>;
  initialImageUrl?: string | null;
  submitLabel: string;
  onSubmit: (data: ItemInput, image: File | null) => Promise<void>;
}) {
  const [values, setValues] = useState<Values>({ ...EMPTY, ...initial });
  const [errors, setErrors] = useState<Partial<Record<keyof Values | "image" | "form", string | undefined>>>({});
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(initialImageUrl ?? null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!image) return;
    const url = URL.createObjectURL(image);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  const set = (k: keyof Values) => (e: { target: { value: string } }) => {
    setValues((v) => ({ ...v, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const onFile = (file: File | undefined) => {
    if (!file) return;
    const err = validateImage(file);
    if (err) {
      setErrors((e) => ({ ...e, image: err }));
      return;
    }
    setErrors((e) => ({ ...e, image: undefined }));
    setImage(file);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = itemSchema.safeParse(values);
    if (!parsed.success) {
      const fe: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (fe[i.path[0] as string] ??= i.message));
      setErrors(fe);
      return;
    }
    setSaving(true);
    try {
      await onSubmit(parsed.data, image);
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : "Something went wrong" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="grid gap-6 md:grid-cols-[280px_1fr]">
      <div>
        <span className="mb-1.5 block text-sm font-medium text-foreground">Product photo</span>
        <label className="flex aspect-square cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-card text-muted-foreground transition hover:border-accent">
          {preview ? (
            <img src={preview} alt="Preview of your item" className="h-full w-full object-cover" />
          ) : (
            <>
              <ImagePlus className="h-8 w-8" />
              <span className="mt-2 text-sm">Click to upload</span>
              <span className="text-xs">JPG, PNG or WebP · max 5 MB</span>
            </>
          )}
          <input
            type="file"
            accept={ALLOWED_IMAGE_TYPES.join(",")}
            className="sr-only"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
        </label>
        {preview && <p className="mt-2 text-xs text-muted-foreground">Click the photo to replace it.</p>}
        {errors.image && <p className="mt-1 text-xs text-destructive">{errors.image}</p>}
      </div>

      <div className="space-y-4">
        <Field error={errors.itemName} label="Item name">
          <input className={inputCls} value={values.itemName} onChange={set("itemName")} aria-invalid={!!errors.itemName} maxLength={100} placeholder="e.g. Casio fx-991ES calculator" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field error={errors.category} label="Category">
            <select className={inputCls} value={values.category} onChange={set("category")} aria-invalid={!!errors.category}>
              <option value="">Select a category</option>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field error={errors.price} label="Price (₹)">
            <input className={inputCls} type="number" min={0} step="1" inputMode="numeric" value={values.price} onChange={set("price")} aria-invalid={!!errors.price} placeholder="e.g. 450" />
          </Field>
        </div>
        <Field error={errors.description} label="Description">
          <textarea className={inputCls} rows={4} value={values.description} onChange={set("description")} aria-invalid={!!errors.description} maxLength={1000} placeholder="Condition, edition, what's included…" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field error={errors.sellerName} label="Your name">
            <input className={inputCls} value={values.sellerName} onChange={set("sellerName")} aria-invalid={!!errors.sellerName} maxLength={60} />
          </Field>
          <Field error={errors.sellerContact} label="Contact (phone or email)">
            <input className={inputCls} value={values.sellerContact} onChange={set("sellerContact")} aria-invalid={!!errors.sellerContact} maxLength={120} />
          </Field>
        </div>
        <p className="text-xs text-muted-foreground">Your contact details are only shown to signed-in students.</p>
        {errors.form && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{errors.form}</p>}
        <Button type="submit" variant="accent" size="lg" disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
