"use client"

import { useMemo, useCallback, Suspense } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { SlidersHorizontal } from "lucide-react"

import type { CatalogProduct, FilterOption } from "@/lib/catalog"
import { routes, slugify } from "@/lib/routes"
import { ProductCard } from "@/components/product/ProductCard"
import { ProductFilters } from "@/components/product/ProductFilters"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface ListingLink {
  href: string
  label: string
  isActive?: boolean
}

interface ProductListingPageProps {
  title: string
  description: string
  products: CatalogProduct[]
  links?: ListingLink[]
  activeLink?: string
  dynamicFilters?: FilterOption[]
  emptyMessage?: string
}

function ProductListingContent({
  title,
  description,
  products,
  links = [],
  activeLink,
  dynamicFilters,
  emptyMessage,
}: ProductListingPageProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // 1. URL State Parsing
  const selectedSizes = useMemo(() => searchParams.getAll("size"), [searchParams])
  const selectedColors = useMemo(() => searchParams.getAll("color"), [searchParams])
  const currentSort = searchParams.get("sort") || "newest"

  // 2. Data Processing & Dynamic UI Generation
  // Extract all available valid sizes/colors from products array (where stock > 0)
  const { availableSizes, availableColors } = useMemo(() => {
    const sizeSet = new Set<string>()
    const colorSet = new Set<string>()

    products.forEach((p) => {
      // If variant logic is not implemented in DB yet, fallback to dummy available options for aesthetic sake.
      // E.g. we assume all default colors/sizes exist if they have no variants, to not break existing layout.
      if (!p.variants || p.variants.length === 0) {
        // Fallback or skip if not variantized yet - we'll just skip to keep logic pure for future
        return
      }

      p.variants.forEach((variant) => {
        if (variant.stock > 0) {
          if (variant.size) sizeSet.add(variant.size)
          if (variant.color) colorSet.add(variant.color)
        }
      })
    })

    return {
      availableSizes: Array.from(sizeSet).sort((a,b) => {
        // Simple sizing sort
        const order = ["XS", "S", "M", "L", "XL", "XXL", "3XL"]
        return order.indexOf(a) - order.indexOf(b)
      }),
      availableColors: Array.from(colorSet).sort()
    }
  }, [products])

  // Construct dynamic filters prop to pass into ProductFilters
  const finalDynamicFilters: FilterOption[] = useMemo(() => {
    // If DB provided dynamic filters, use them as source of truth for options
    if (dynamicFilters && dynamicFilters.length > 0) {
      return dynamicFilters
    }

    // Otherwise fallback to extracting sizes and colors from available products
    const filters: FilterOption[] = []
    if (availableSizes.length > 0) {
      filters.push({ id: "size", label: "Beden", values: availableSizes })
    }
    if (availableColors.length > 0) {
      filters.push({ id: "color", label: "Renk", values: availableColors })
    }

    // Extract attribute filters from product data
    const fabricSet = new Set<string>()
    const fitSet = new Set<string>()
    const tipSet = new Set<string>()
    const collarSet = new Set<string>()

    products.forEach((p: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => {
      if (p.fabricType) fabricSet.add(p.fabricType)
      if (p.fit) fitSet.add(p.fit)
      if (p.tip) tipSet.add(p.tip)
      if (p.collarType) collarSet.add(p.collarType)
    })

    if (fabricSet.size > 0) {
      filters.push({ id: "fabricType", label: "Kumaş", values: Array.from(fabricSet).sort() })
    }
    if (fitSet.size > 0) {
      filters.push({ id: "fit", label: "Kalıp", values: Array.from(fitSet).sort() })
    }
    if (tipSet.size > 0) {
      filters.push({ id: "tip", label: "Tip", values: Array.from(tipSet).sort() })
    }
    if (collarSet.size > 0) {
      filters.push({ id: "collarType", label: "Yaka", values: Array.from(collarSet).sort() })
    }

    return filters
  }, [availableSizes, availableColors, dynamicFilters, products])

  // 3. Client-Side Filtering
  const filteredProducts = useMemo(() => {
    // Collect all filter keys that active in URL except 'sort'
    const activeFilterKeys = Array.from(searchParams.keys()).filter(k => k !== 'sort' && k !== 'sub');

    return products.filter((p) => {
      let passes = true;

      for (const key of activeFilterKeys) {
        const selectedValues = searchParams.getAll(key);
        if (selectedValues.length === 0) continue;

        if (key === 'size') {
          const hasMatchingSize = p.variants?.some((v) => v.stock > 0 && selectedValues.includes(v.size));
          if (!hasMatchingSize) { passes = false; break; }
        } else if (key === 'color' || key === 'renk') {
          const hasMatchingColor = p.variants?.some((v) => v.stock > 0 && selectedValues.includes(v.color));
          if (!hasMatchingColor) { passes = false; break; }
        } else {
          // Generic filter (fabric, material, collar, sleeve etc)
          // Assume these are stored as arrays or strings at the top level of the Product document
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const pVal = (p as any)[key];
          if (Array.isArray(pVal)) {
            const hasMatch = selectedValues.some(v => pVal.includes(v));
            if (!hasMatch) { passes = false; break; }
          } else if (typeof pVal === 'string') {
            if (!selectedValues.includes(pVal)) { passes = false; break; }
          } else {
            // If the product doesn't have this field defined at all, we could hide it or let it pass?
            // Usually, standard filters require a strict match.
            passes = false; break;
          }
        }
      }

      return passes;
    }).sort((a, b) => {
      // Standard Sort Logic
      const aPrice = a.discountPrice ?? a.originalPrice
      const bPrice = b.discountPrice ?? b.originalPrice
      
      if (currentSort === "price-asc") return aPrice - bPrice
      if (currentSort === "price-desc") return bPrice - aPrice
      return 0 // "newest" fallback to original server order
    })
  }, [products, currentSort, searchParams])

  const handleSortChange = useCallback((value: string | null) => {
    if (!value) return;
    const params = new URLSearchParams(searchParams.toString())
    params.set("sort", value)
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }, [searchParams, router, pathname])

  return (
    <div className="w-full min-h-screen bg-black pt-10 pb-24">
      <div className="container max-w-screen-2xl mx-auto px-4 md:px-8 mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-5xl font-light uppercase tracking-[0.08em] sm:tracking-[0.14em] text-white break-words animate-in fade-in slide-in-from-bottom-2 duration-700">
          {title}
        </h1>
        <p className="mt-3 text-sm sm:text-base text-white/65 max-w-3xl animate-in fade-in duration-1000 delay-150">
          {description}
        </p>
        <div className="h-px w-full bg-white/10 mt-6" />
      </div>

      {links.length > 0 && (
        <div className="container max-w-screen-2xl mx-auto px-4 md:px-8 mb-8">
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {links.map((link) => {
              const isActive = link.isActive ?? (activeLink ? link.href === activeLink : false)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  prefetch={false}
                  className={cn(
                    "px-4 py-2 rounded-full border text-xs sm:text-sm tracking-wide transition-colors touch-manipulation",
                    isActive
                      ? "bg-white text-black border-white"
                      : "border-white/20 text-white/80 hover:bg-white hover:text-black"
                  )}
                >
                  {link.label}
                </Link>
              )
            })}
          </div>
        </div>
      )}

      <div className="container max-w-screen-2xl mx-auto px-4 md:px-8 flex flex-col md:flex-row gap-8 md:gap-10">
        {/* Mobile filter + sort */}
        <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Sheet>
            <SheetTrigger
              render={
                <Button
                  variant="outline"
                  className="w-full min-h-11 justify-center bg-black text-white border-white/20 hover:bg-white/10 gap-2 touch-manipulation"
                />
              }
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filtrele
            </SheetTrigger>
            <SheetContent
              side="left"
              className="bg-black/95 backdrop-blur-xl border-white/10 text-white w-full sm:w-[420px] overflow-y-auto"
            >
              <SheetTitle className="sr-only">Filters</SheetTitle>
              <SheetDescription className="sr-only">Product filtering options</SheetDescription>
              <div className="pt-6">
                <ProductFilters dynamicFilters={finalDynamicFilters} />
              </div>
            </SheetContent>
          </Sheet>

          <div className="min-w-0">
            <Select value={currentSort} onValueChange={handleSortChange}>
              <SelectTrigger className="w-full min-h-11 bg-black border-white/20 text-white hover:bg-white/5">
                <SelectValue placeholder="Sırala" />
              </SelectTrigger>
              <SelectContent className="bg-black border-white/20 text-white">
                <SelectItem value="newest">En yeniler</SelectItem>
                <SelectItem value="price-asc">Fiyat: Düşükten yükseğe</SelectItem>
                <SelectItem value="price-desc">Fiyat: Yüksekten düşüğe</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Desktop sidebar filters */}
        <aside className="hidden md:block w-full md:w-1/4 lg:w-1/5 shrink-0 min-w-0">
          <div className="sticky top-24">
            <ProductFilters dynamicFilters={finalDynamicFilters} />
          </div>
        </aside>

        {/* Product grid */}
        <div className="w-full md:w-3/4 lg:w-4/5 min-w-0">
          <div className="hidden md:flex items-center justify-between mb-6 gap-3">
            <span className="text-sm text-white/50">{filteredProducts.length} ürün</span>
            <div className="w-full max-w-56">
              <Select value={currentSort} onValueChange={handleSortChange}>
                <SelectTrigger className="w-full bg-black border-white/20 text-white hover:bg-white/5">
                  <SelectValue placeholder="Sırala" />
                </SelectTrigger>
                <SelectContent className="bg-black border-white/20 text-white">
                  <SelectItem value="newest">En yeniler</SelectItem>
                  <SelectItem value="price-asc">Fiyat: Düşükten yükseğe</SelectItem>
                  <SelectItem value="price-desc">Fiyat: Yüksekten düşüğe</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="rounded-sm border border-white/10 bg-white/5 px-4 py-16 text-center animate-in fade-in zoom-in-95 duration-500">
              <p className="text-white mb-6 text-lg font-light tracking-wide">
                {emptyMessage ?? "Bu kriterlere uygun ürün bulunamadı."}
              </p>
              <button
                onClick={() => router.push(pathname, { scroll: false })}
                className="inline-flex px-8 py-3 bg-white text-black text-xs uppercase tracking-widest hover:bg-white/90 transition-colors font-medium"
              >
                Filtreleri Temizle
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 md:gap-6">
              {filteredProducts.map((product, index) => {
                // Determine correct section route based on current path
                const productSlug = product.slug || slugify(product.title || product.id)
                let href: string
                if (pathname.startsWith('/giyim')) href = routes.clothingProduct(productSlug)
                else if (pathname.startsWith('/aksesuar')) href = routes.accessoryProduct(productSlug)
                else if (pathname.startsWith('/yeni-gelenler')) href = routes.newArrivalProduct(productSlug)
                else if (pathname.startsWith('/trend')) href = routes.trendProduct(productSlug)
                else href = routes.product(productSlug)

                return (
                  <div 
                    key={product.id}
                    className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out fill-mode-both"
                  >
                    <ProductCard
                      id={product.id}
                      title={product.title}
                      imageUrl={product.imageUrl}
                      colorCount={product.colorCount || (product.variants ? new Set(product.variants.map((v: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => v.color)).size : 0)}
                      stockCount={product.stockCount}
                      originalPrice={product.originalPrice}
                      discountPrice={product.discountPrice}
                      cartPrice={product.cartPrice}
                      productHref={href}
                      trendyolUrl={product.trendyolUrl}
                      shopierUrl={product.shopierUrl}
                      productCode={product.productCode}
                      priority={index < 6}
                      sizes="(max-width: 1024px) 50vw, 25vw"
                    />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function ProductListingPage(props: ProductListingPageProps) {
  return (
    <Suspense fallback={
      <div className="w-full min-h-screen bg-black flex items-center justify-center pt-20">
        <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    }>
      <ProductListingContent {...props} />
    </Suspense>
  )
}
