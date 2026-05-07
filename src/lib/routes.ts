/**
 * Centralized route definitions for HUMAN NATURE storefront.
 * All internal links MUST reference these constants.
 */

/** Generate a URL-friendly slug from a Turkish product title */
export function slugify(text: string): string {
  const charMap: Record<string, string> = {
    ç: "c", Ç: "C", ğ: "g", Ğ: "G", ı: "i", İ: "I",
    ö: "o", Ö: "O", ş: "s", Ş: "S", ü: "u", Ü: "U",
  }
  return text
    .split("")
    .map((ch) => charMap[ch] || ch)
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

export const routes = {
  home: "/",

  /* ── Section listing pages ── */
  allProducts: "/tum-urunler",
  newArrivals: "/yeni-gelenler",
  trending: "/trend",
  clothing: "/giyim",
  accessories: "/aksesuar",

  /* ── Utility pages ── */
  cart: "/sepet",
  checkout: "/siparis-tamamla",

  /* ── Auth ── */
  account: "/hesap",
  login: "/giris-yapmak",
  register: "/kayit-olmak",

  /* ── Legal ── */
  legal: {
    distanceSales: "/mesafeli-satis-sozlesmesi",
    returnsExchange: "/iade-ve-degisim",
    privacy: "/gizlilik-politikasi",
    terms: "/kullanim-kosullari",
    contact: "/iletisim",
  },

  /* ── Dynamic product detail routes (per section) ── */
  product: (slug: string) => `/tum-urunler/${slug}`,
  clothingProduct: (slug: string) => `/giyim/${slug}`,
  accessoryProduct: (slug: string) => `/aksesuar/${slug}`,
  newArrivalProduct: (slug: string) => `/yeni-gelenler/${slug}`,
  trendProduct: (slug: string) => `/trend/${slug}`,

  /* ── Asset helper (for public/ files) ── */
  asset: (path: string) => (path.startsWith("/") ? path : `/${path}`),
} as const
