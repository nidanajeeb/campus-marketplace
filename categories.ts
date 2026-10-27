import { BookOpen, Cpu, Ruler, FlaskConical, PenLine, Headphones, Package, type LucideIcon } from "lucide-react";

export const CATEGORIES = [
  "Books",
  "Electronics",
  "Engineering Tools",
  "Lab Supplies",
  "Stationery",
  "Accessories",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_ICONS: Record<Category, LucideIcon> = {
  Books: BookOpen,
  Electronics: Cpu,
  "Engineering Tools": Ruler,
  "Lab Supplies": FlaskConical,
  Stationery: PenLine,
  Accessories: Headphones,
  Other: Package,
};
