import { notFound } from "next/navigation"
import { ProductGallery } from "@/components/product/ProductGallery"
import { ProductInfo } from "@/components/product/ProductInfo"
import { getServerProductBySlug, getServerColorSiblings } from "@/lib/product-service-server"
import Link from "next/link"

export const dynamic = "force-dynamic"

interface ProductDetailPageProps {
  /** The product slug from the URL */
  slug: string
  /** The section name for the breadcrumb (e.g. "Tüm Ürünler", "Giyim") */
  sectionName: string
  /** The section href for the breadcrumb link */
  sectionHref: string
}

interface ColorSibling {
  slug: string
  colorName: string
}

/**
 * Shared product detail page component.
 * Used by all section routes: /tum-urunler/[slug], /giyim/[slug], /aksesuar/[slug], etc.
 * 
 * Looks up the product by its `slug` field in Firestore using Admin SDK.
 * Falls back to document ID if no slug field match is found.
 */
export async function ProductDetailPage({ slug, sectionName, sectionHref }: ProductDetailPageProps) {
  console.log(`[ProductDetailPage] Rendering for slug: ${slug}`);
  
  try {
    // 1. Fetch product using server-side Admin SDK service
    const result = await getServerProductBySlug(slug)

    if (!result) {
      console.log(`[ProductDetailPage] Product not found for slug: ${slug}`);
      notFound()
    }

    const productId = result.id
    const product = result.data

    // 2. Fetch color siblings in parallel (only if groupId exists)
    let colorSiblings: ColorSibling[] = []
    if (product.groupId) {
      console.log(`[ProductDetailPage] Fetching siblings for groupId: ${product.groupId}`);
      colorSiblings = await getServerColorSiblings(product.groupId as string);
      console.log(`[ProductDetailPage] Found ${colorSiblings.length} siblings`);
    }

    return (
      <div className="w-full min-h-screen bg-black pt-10 pb-32">
        <div className="container max-w-screen-xl mx-auto px-4 md:px-8">
          {/* Breadcrumb */}
          <div className="mb-6 sm:mb-8 text-[11px] sm:text-xs uppercase tracking-[0.12em] sm:tracking-widest text-white/50 break-words flex items-center flex-wrap gap-y-1">
            <Link href="/" className="hover:text-white/80 transition-colors">Ana Sayfa</Link>
            <span className="mx-2">/</span>
            <Link href={sectionHref} className="hover:text-white/80 transition-colors">{sectionName}</Link>
            <span className="mx-2">/</span>
            <span className="text-white/80">{(product.title || product.name) as string}</span>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 sm:gap-12 lg:gap-20">
            <div className="w-full lg:w-1/2 min-w-0">
              <ProductGallery images={(product.images as string[]) || (product.imageUrl ? [product.imageUrl as string] : [])} />
              
              {!!(product.trendyolUrl || product.shopierUrl) && (
                <div className="mt-8 p-5 sm:p-6 bg-gradient-to-b from-white/[0.03] to-transparent border border-white/10 rounded-2xl flex flex-col items-center justify-center space-y-5 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="flex items-center gap-3">
                    <div className="h-px w-8 bg-white/20" />
                    <p className="text-white/60 text-[10px] sm:text-xs uppercase tracking-[0.2em] font-medium text-center">
                      Diğer Platformlar
                    </p>
                    <div className="h-px w-8 bg-white/20" />
                  </div>
                  <div className="flex flex-col w-full sm:flex-row items-center gap-3 sm:gap-4 justify-center">
                    {!!product.trendyolUrl && (
                      <a
                        href={product.trendyolUrl as string}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:flex-1 flex items-center justify-center gap-3 px-6 py-3.5 bg-gradient-to-r from-[#F27A1A] to-[#e06811] hover:shadow-[0_0_20px_rgba(242,122,26,0.3)] transition-all duration-300 rounded-xl group relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                        <span className="relative z-10 bg-white text-[#F27A1A] text-[10px] font-black px-1.5 py-0.5 rounded-sm tracking-tighter shadow-sm">TY</span>
                        <span className="relative z-10 text-white text-xs sm:text-sm font-bold tracking-wide">Trendyol'da Gör</span>
                      </a>
                    )}
                    {!!product.shopierUrl && (
                      <a
                        href={product.shopierUrl as string}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:flex-1 flex items-center justify-center gap-3 px-6 py-3.5 bg-gradient-to-r from-[#1A8B9D] to-[#137180] hover:shadow-[0_0_20px_rgba(26,139,157,0.3)] transition-all duration-300 rounded-xl group relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                        <span className="relative z-10 bg-white text-[#1A8B9D] text-[10px] font-black px-1.5 py-0.5 rounded-sm tracking-tighter shadow-sm">SH</span>
                        <span className="relative z-10 text-white text-xs sm:text-sm font-bold tracking-wide">Shopier'de Gör</span>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="w-full lg:w-1/2 mt-4 lg:mt-0 min-w-0">
              <ProductInfo
                product={{
                  id: productId,
                  name: (product.title || product.name) as string,
                  price: (product.discountPrice || product.price) as number,
                  description: product.description as string,
                  image: (product.imageUrl || (product.images && (product.images as string[])[0])) as string,
                  variants: (product.variants || []) as { size: string; color: string; stock: number }[],
                  colorName: (product.colorName || null) as string | null,
                  stockCount: product.stockCount as number | undefined,
                  fabricType: (product.fabricType || null) as string | null,
                  fit: (product.fit || null) as string | null,
                  tip: (product.tip || null) as string | null,
                  collarType: (product.collarType || null) as string | null,
                  productCode: (product.productCode || null) as string | null,
                  cartPrice: (product.cartPrice || null) as number | null,
                }}
                colorSiblings={colorSiblings}
                currentSlug={slug}
                sectionHref={sectionHref}
              />
            </div>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error(`[ProductDetailPage] Error rendering page for slug ${slug}:`, error);
    // You could also return a custom error UI here
    throw error; // Re-throw to show the error page
  }
}
