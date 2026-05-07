import { routes } from "@/lib/routes"

/* ═══════════════════════════════════════════════════════════
   Types — structured to migrate to Firestore with zero UI changes
   ═══════════════════════════════════════════════════════════ */

export interface CatalogProduct {
  id: string
  slug: string
  title: string
  imageUrl: string
  images: string[]
  description: string
  originalPrice: number
  discountPrice: number
  cartPrice?: number
  colorCount: number
  category: string           // e.g., "giyim", "aksesuar"
  subCategory?: string       // slug: "tisort" | "sortlu-takim" | "spor-takim"
  isTrending: boolean
  isNewArrival: boolean
  salesCount: number
  stockCount?: number
  createdAt: number
  productCode?: string
  trendyolUrl?: string
  shopierUrl?: string
  variants?: {
    size: string
    color: string
    stock: number
  }[]
}

interface CatalogSection {
  slug: string
  title: string
  description: string
}

/** Dynamic filter option — each subcategory can have its own set */
export interface FilterOption {
  id: string
  label: string
  values: string[]
}

interface SubCategoryConfig {
  slug: string
  title: string
  description: string
  /** Filter options specific to this subcategory (admin-configurable later) */
  filters: FilterOption[]
}

/* ═══════════════════════════════════════════════════════════
   Top-level categories (for navbar + routing)
   ═══════════════════════════════════════════════════════════ */

export const catalogCategories: CatalogSection[] = [
  {
    slug: "giyim",
    title: "Giyim",
    description: "Modern kesimler, premium kumaşlar ve günlük şıklık.",
  },
  {
    slug: "aksesuar",
    title: "Aksesuar",
    description: "Stili tamamlayan kemer, kravat ve diğer detaylar.",
  },
]

/* ═══════════════════════════════════════════════════════════
   Subcategories — UNIFIED across Yeni Gelenler, Giyim, and
   Koleksiyonlar pages. Single source of truth.
   
   In the future these will come from Firestore:
   const subcategories = await getDocs(collection(db, "subcategories"))
   ═══════════════════════════════════════════════════════════ */

export const productSubcategories: SubCategoryConfig[] = [
  {
    slug: "tisort",
    title: "Tişört",
    description: "Günlük ve şık tişört modelleri.",
    filters: [
      { id: "size", label: "Beden", values: ["S", "M", "L", "XL", "XXL"] },
      { id: "color", label: "Renk", values: ["Siyah", "Beyaz", "Gri", "Lacivert"] },
      { id: "collar", label: "Yaka Tipi", values: ["Bisiklet Yaka", "V Yaka", "Polo Yaka"] },
      { id: "sleeve", label: "Kol Uzunluğu", values: ["Kısa Kol", "Uzun Kol"] },
    ],
  },
  {
    slug: "sortlu-takim",
    title: "Şortlu Takım",
    description: "Yaz sezonu için rahat ve şık şortlu takımlar.",
    filters: [
      { id: "size", label: "Beden", values: ["S", "M", "L", "XL", "XXL"] },
      { id: "color", label: "Renk", values: ["Siyah", "Beyaz", "Bej", "Haki"] },
      { id: "fabric", label: "Kumaş", values: ["Pamuk", "Keten", "Polyester"] },
    ],
  },
  {
    slug: "spor-takim",
    title: "Spor Takım",
    description: "Aktif yaşam için konforlu spor takımlar.",
    filters: [
      { id: "size", label: "Beden", values: ["S", "M", "L", "XL", "XXL"] },
      { id: "color", label: "Renk", values: ["Siyah", "Gri", "Lacivert", "Bordo"] },
      { id: "material", label: "Malzeme", values: ["Pamuk", "Polyester", "Dri-Fit"] },
    ],
  },
]

/** Aksesuar subcategories — intentionally EMPTY.
 *  Will be populated from admin panel / Firestore.
 */
export const accessorySubcategories: SubCategoryConfig[] = []



/* ═══════════════════════════════════════════════════════════
   Product catalog (mock data — will be replaced by Firestore)
   ═══════════════════════════════════════════════════════════ */

export const catalogProducts: CatalogProduct[] = [
  {
    id: "p1",
    slug: "klasik-italyan-takim-elbise",
    title: "Klasik İtalyan Takım Elbise",
    imageUrl: routes.asset("/products/suit.png"),
    images: [
      routes.asset("/products/suit.png"),
      routes.asset("/products/shirt.png"),
      routes.asset("/products/pants.png"),
    ],
    description: "İnce işçilik ve premium kumaşla hazırlanan klasik takım elbise.",
    originalPrice: 8500,
    discountPrice: 6800,
    cartPrice: 5999,
    colorCount: 4,
    category: "giyim",
    subCategory: "spor-takim",
    isTrending: true,
    isNewArrival: true,
    salesCount: 125,
    createdAt: Date.now() - 86400000 * 2, // 2 days ago
  },
  {
    id: "p2",
    slug: "premium-pamuklu-tisort",
    title: "Premium Pamuklu Tişört",
    imageUrl: routes.asset("/products/shirt.png"),
    images: [
      routes.asset("/products/shirt.png"),
      routes.asset("/products/suit.png"),
      routes.asset("/products/pants.png"),
    ],
    description: "Gün boyu konfor sağlayan nefes alabilen pamuklu kumaş ve slim fit kesim.",
    originalPrice: 1200,
    discountPrice: 899,
    cartPrice: 799,
    colorCount: 6,
    category: "giyim",
    subCategory: "tisort",
    isTrending: true,
    isNewArrival: true,
    salesCount: 340,
    createdAt: Date.now() - 86400000 * 5,
  },
  {
    id: "p3",
    slug: "premium-yun-pantolon",
    title: "Premium Yün Pantolon",
    imageUrl: routes.asset("/products/pants.png"),
    images: [
      routes.asset("/products/pants.png"),
      routes.asset("/products/suit.png"),
      routes.asset("/products/shirt.png"),
    ],
    description: "Yüksek kalite yün karışımlı kumaşı sayesinde hem rahat hem de şık.",
    originalPrice: 2400,
    discountPrice: 1990,
    colorCount: 3,
    category: "giyim",
    subCategory: "sortlu-takim",
    isTrending: true,
    isNewArrival: false,
    salesCount: 210,
    createdAt: Date.now() - 86400000 * 15,
  },
  {
    id: "p4",
    slug: "ipek-kravat-koleksiyonu",
    title: "İpek Kravat Koleksiyonu",
    imageUrl: routes.asset("/products/tie.png"),
    images: [
      routes.asset("/products/tie.png"),
      routes.asset("/products/suit.png"),
      routes.asset("/products/shirt.png"),
    ],
    description: "El yapımı ipek kravatlar ile klasik kombinlerinizi tamamlayın.",
    originalPrice: 950,
    discountPrice: 650,
    cartPrice: 549,
    colorCount: 8,
    category: "aksesuar",
    isTrending: true,
    isNewArrival: false,
    salesCount: 450,
    createdAt: Date.now() - 86400000 * 30,
  },
  {
    id: "p5",
    slug: "modern-kemer",
    title: "Modern Kemer",
    imageUrl: routes.asset("/products/tie.png"),
    images: [routes.asset("/products/tie.png"), routes.asset("/products/pants.png")],
    description: "Deri detaylı modern kemer ile günlük kombinlerinizi güçlendirin.",
    originalPrice: 700,
    discountPrice: 520,
    colorCount: 3,
    category: "aksesuar",
    isTrending: false,
    isNewArrival: false,
    salesCount: 85,
    createdAt: Date.now() - 86400000 * 45,
  },
  {
    id: "p6",
    slug: "yeni-sezon-spor-takim",
    title: "Yeni Sezon Spor Takım",
    imageUrl: routes.asset("/products/suit.png"),
    images: [routes.asset("/products/suit.png"), routes.asset("/products/shirt.png")],
    description: "Yeni sezon spor takım, modern kesim ve hafif yapısı ile öne çıkar.",
    originalPrice: 4200,
    discountPrice: 3490,
    colorCount: 4,
    category: "giyim",
    subCategory: "spor-takim",
    isTrending: false,
    isNewArrival: true,
    salesCount: 12,
    createdAt: Date.now() - 86400000 * 1,
  },
]

