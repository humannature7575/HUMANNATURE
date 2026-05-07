"use client"

import { useEffect, useState, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { ProductListingPage } from "@/components/storefront/ProductListingPage"
import { routes } from "@/lib/routes"
import { subscribeToProductsByCategory, getCategoriesConfig } from "@/lib/firestore-cache"
import { CatalogProduct } from "@/types"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"

import { Suspense } from "react"

function ClothingContent() {
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [links, setLinks] = useState<{ href: string; label: string }[]>([])
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()

  // Current subcategory slug from URL (?sub=tisort)
  const activeSub = searchParams.get("sub")

  useEffect(() => {
    // Fetch categories config once (30s cache) + subscribe to products real-time
    getCategoriesConfig().then((catData) => {
      if (catData) {
        const list = (catData?.list as Array<{ slug: string; title: string; subCategories?: Array<{ slug: string; title: string }> }>) ?? []
        const giyimCat = list.find((c) => c.slug === "giyim")
        const subs = giyimCat?.subCategories ?? []
        setLinks([
          { href: routes.clothing, label: "Tümü" },
          ...subs.map((sub) => ({
            href: `${routes.clothing}?sub=${sub.slug}`,
            label: sub.title,
          })),
        ])
      } else {
        // Fallback: subcategories collection
        getDocs(collection(db, "subcategories")).then((subSnap) => {
          const fetchedSub: any /* eslint-disable-line @typescript-eslint/no-explicit-any */[] = []
          subSnap.forEach((doc) => fetchedSub.push({ id: doc.id, ...doc.data() }))
          setLinks([
            { href: routes.clothing, label: "Tümü" },
            ...fetchedSub.map((sub) => ({
              href: `${routes.clothing}?sub=${sub.slug || sub.id}`,
              label: sub.title || sub.name || sub.id,
            })),
          ])
        })
      }
    }).catch((error) => console.error("Error fetching categories:", error))

    // Real-time product subscription
    const unsubscribe = subscribeToProductsByCategory(
      "giyim",
      (fetched) => {
        setProducts(fetched)
        setLoading(false)
      },
      (error) => {
        console.error("Error fetching clothing products:", error)
        setLoading(false)
      }
    )
    return () => unsubscribe()
  }, [])

  // ── Filter products by subcategory when ?sub= is present ──
  const filteredProducts = useMemo(() => {
    if (!activeSub) return products
    return products.filter((p) => p.subCategory === activeSub)
  }, [products, activeSub])

  // Determine which link is currently active
  const activeLink = activeSub
    ? `${routes.clothing}?sub=${activeSub}`
    : routes.clothing

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-black flex items-center justify-center pt-20">
        <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <ProductListingPage
      title="Giyim"
      description="Modern kesimler, premium kumaşlar ve günlük şıklık."
      products={filteredProducts}
      links={links}
      activeLink={activeLink}
      emptyMessage={
        activeSub
          ? "Bu alt kategoride henüz ürün bulunmuyor."
          : undefined
      }
    />
  )
}

export default function ClothingPage() {
  return (
    <Suspense fallback={
      <div className="w-full min-h-screen bg-black flex items-center justify-center pt-20">
        <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    }>
      <ClothingContent />
    </Suspense>
  )
}
