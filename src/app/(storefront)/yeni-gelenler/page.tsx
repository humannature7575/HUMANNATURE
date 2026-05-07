"use client"

import { useEffect, useState } from "react"
import { ProductListingPage } from "@/components/storefront/ProductListingPage"
import { subscribeToNewArrivalProducts } from "@/lib/firestore-cache"
import { CatalogProduct } from "@/types"

export default function NewArrivalsPage() {
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = subscribeToNewArrivalProducts(
      (fetched) => {
        // Sort by createdAt DESC
        const sorted = [...fetched].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
        setProducts(sorted)
        setLoading(false)
      },
      (error) => {
        console.error("Error fetching new arrivals:", error)
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
      title="Yeni Gelenler"
      description="Bu sezonun en yeni ürünleriyle gardırobunuzu yenileyin."
      products={products}
      links={[]}
    />
  )
}
