export type { CatalogProduct } from "@/lib/catalog";

export interface CategoryMeta {
  id?: string;
  name?: string;
  description?: string;
  slug: string;
  title: string;
  subCategories?: { slug: string; title: string }[];
}
