import { ProductDetailPage } from "@/components/storefront/ProductDetailPage"

export const dynamic = "force-dynamic"

export default async function DynamicCategoryProductPage({
  params,
}: {
  params: Promise<{ kategori: string; slug: string }>
}) {
  const { kategori, slug } = await params

  // Capitalize the category name for display
  const sectionName = kategori.charAt(0).toUpperCase() + kategori.slice(1)

  return (
    <ProductDetailPage
      slug={slug}
      sectionName={sectionName}
      sectionHref={`/${kategori}`}
    />
  )
}
