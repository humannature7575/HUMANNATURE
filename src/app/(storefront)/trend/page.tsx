"use client"

import { useEffect, useState } from "react"
import { ProductListingPage } from "@/components/storefront/ProductListingPage"
import { routes } from "@/lib/routes"
import { subscribeToTrendingProducts } from "@/lib/firestore-cache"
import { CatalogProduct } from "@/types"

export default function TrendPage() {
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch all trending products (up to 50), sorted client-side by salesCount
    const unsubscribe = subscribeToTrendingProducts(
      50,
      (fetched) => {
        const sorted = [...fetched].sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0))
        setProducts(sorted)
        setLoading(false)
      },
      (error) => {
        console.error("Error fetching trending products:", error)
        setLoading(false)
      }
    )
    return () => unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-black flex items-center justify-center pt-20">
        <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <ProductListingPage
      title="Trend Ürünler"
      description="En çok ilgi gören ve en çok satılan parçaları keşfedin."
      products={products}
      links={[
        { href: routes.trending, label: "Trend" },
        { href: routes.newArrivals, label: "Yeni Gelenler" },
        { href: routes.allProducts, label: "Tüm Ürünler" },
      ]}
    />
  )
}
