"use client"

import { useEffect, useState, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { ProductListingPage } from "@/components/storefront/ProductListingPage"
import { subscribeToProductsByCategory, getCategoriesConfig } from "@/lib/firestore-cache"
import { CatalogProduct } from "@/types"

import { Suspense } from "react"

function AccessoriesContent() {
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [links, setLinks] = useState<{ href: string; label: string }[]>([])
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()

  const activeSub = searchParams.get("sub")

  useEffect(() => {
    // Fetch categories config once (30s cache)
    getCategoriesConfig().then((catData) => {
      if (catData) {
        const list = (catData?.list as Array<{ slug: string; title: string; subCategories?: Array<{ slug: string; title: string }> }>) ?? []
        const aksCat = list.find((c) => c.slug === "aksesuar")
        const subs = aksCat?.subCategories ?? []
        if (subs.length > 0) {
          setLinks([
            { href: "/aksesuar", label: "Tümü" },
            ...subs.map((sub) => ({
              href: `/aksesuar?sub=${sub.slug}`,
              label: sub.title,
            })),
          ])
        }
      }
    }).catch((error) => console.error("Error fetching categories:", error))

    // Real-time product subscription
    const unsubscribe = subscribeToProductsByCategory(
      "aksesuar",
      (fetched) => {
        setProducts(fetched)
        setLoading(false)
      },
      (error) => {
        console.error("Error fetching accessory products:", error)
        setLoading(false)
      }
    )
    return () => unsubscribe()
  }, [])

  const filteredProducts = useMemo(() => {
    if (!activeSub) return products
    return products.filter((p) => p.subCategory === activeSub)
  }, [products, activeSub])

  const activeLink = activeSub ? `/aksesuar?sub=${activeSub}` : "/aksesuar"

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-black flex items-center justify-center pt-20">
        <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <ProductListingPage
      title="Aksesuar"
      description="Kemer, kravat ve tamamlayıcı detaylarla stilinizi güçlendirin."
      products={filteredProducts}
      links={links}
      activeLink={activeLink}
      emptyMessage={
        activeSub
          ? "Bu alt kategoride henüz ürün bulunmuyor."
          : "Yakında yeni kategoriler ve ürünler eklenecektir."
      }
    />
  )
}

export default function AccessoriesPage() {
  return (
    <Suspense fallback={
      <div className="w-full min-h-screen bg-black flex items-center justify-center pt-20">
        <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    }>
      <AccessoriesContent />
    </Suspense>
  )
}
