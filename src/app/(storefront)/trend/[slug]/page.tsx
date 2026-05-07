import { routes } from "@/lib/routes"
import { ProductDetailPage } from "@/components/storefront/ProductDetailPage"

export const dynamic = "force-dynamic"

export default async function TrendProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  return (
    <ProductDetailPage
      slug={slug}
      sectionName="Trend Ürünler"
      sectionHref={routes.trending}
    />
  )
}
