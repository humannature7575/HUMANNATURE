import { routes } from "@/lib/routes"
import { ProductDetailPage } from "@/components/storefront/ProductDetailPage"

export const dynamic = "force-dynamic"

export default async function ClothingProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  return (
    <ProductDetailPage
      slug={slug}
      sectionName="Giyim"
      sectionHref={routes.clothing}
    />
  )
}
