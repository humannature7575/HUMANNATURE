"use client"

import { useEffect, useState } from "react"
import { ProductCard } from "@/components/product/ProductCard"
import { routes, slugify } from "@/lib/routes"
import { subscribeToAllProducts } from "@/lib/firestore-cache"
import { CatalogProduct } from "@/types"

export default function AllProductsPage() {
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = subscribeToAllProducts(
      (fetched) => {
        setProducts(fetched)
        setLoading(false)
      },
      (error) => {
        console.error("Error fetching all products:", error)
        setLoading(false)
      }
    )
    return () => unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-black pt-10 pb-24 border-t border-white/5">
        <div className="container max-w-screen-2xl mx-auto px-4 md:px-8 mb-10">
          <div className="h-10 max-w-[300px] bg-white/10 animate-pulse mb-3" />
          <div className="h-5 max-w-[500px] bg-white/5 animate-pulse" />
          <div className="h-px w-full bg-white/10 mt-6" />
        </div>
        <div className="container max-w-screen-2xl mx-auto px-4 md:px-8 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 md:gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((skeleton) => (
            <div key={skeleton} className="aspect-[3/4] w-full bg-white/5 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen bg-black pt-10 pb-24 border-t border-white/5">
      <div className="container max-w-screen-2xl mx-auto px-4 md:px-8 mb-10">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-light uppercase tracking-widest text-white">
          Tüm Ürünler
        </h1>
        <p className="mt-3 text-sm sm:text-base text-white/65 max-w-3xl">
          En yeni ve tüm sezon ürünlerimizi burada bulabilirsiniz.
        </p>
        <div className="h-px w-full bg-white/10 mt-6" />
      </div>

      <div className="container max-w-screen-2xl mx-auto px-4 md:px-8 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 md:gap-6">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            id={product.id}
            title={product.title}
            imageUrl={product.imageUrl}
            colorCount={product.colorCount || (product.variants ? new Set(product.variants.map((v: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => v.color)).size : 0)}
            stockCount={product.stockCount}
            originalPrice={product.originalPrice}
            discountPrice={product.discountPrice}
            cartPrice={product.cartPrice}
            productHref={routes.product(product.slug || slugify(product.title || product.id))}
            trendyolUrl={product.trendyolUrl}
            shopierUrl={product.shopierUrl}
            productCode={product.productCode}
          />
        ))}
        {products.length === 0 && (
          <div className="col-span-full py-20 text-center text-white/50">
            Şu anda ürün bulunmamaktadır.
          </div>
        )}
      </div>
    </div>
  )
}
