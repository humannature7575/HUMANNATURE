import {
  collection,
  getDocs,
  query,
  where,
  limit,
  orderBy,
  doc,
  getDoc,
  onSnapshot,
  Query,
  DocumentData,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { CatalogProduct } from "@/lib/catalog"

console.log("Firestore cache module loaded. DB instance:", !!db);

/* ═══════════════════════════════════════════════════════════
   Short-TTL Cache (for settings/config only)
   ─────────────────────────────────────────────────────────
   Product data now uses real-time onSnapshot listeners.
   Config/settings use a 30-second TTL to avoid excessive reads.
   ═══════════════════════════════════════════════════════════ */

const CONFIG_TTL = 30 * 1000 // 30 seconds (for settings docs only)

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

const configCache = new Map<string, CacheEntry<unknown>>()

function getConfigCacheEntry<T>(key: string): T | null {
  const entry = configCache.get(key) as CacheEntry<T> | undefined
  if (!entry) return null
  if (Date.now() - entry.timestamp > entry.ttl) {
    configCache.delete(key)
    return null
  }
  return entry.data
}

function setConfigCacheEntry<T>(key: string, data: T, ttl = CONFIG_TTL): void {
  configCache.set(key, { data, timestamp: Date.now(), ttl })
}

/** Clear config cache entries */
export function invalidateCache(key?: string): void {
  if (key) {
    configCache.delete(key)
  } else {
    configCache.clear()
  }
}

/* ═══════════════════════════════════════════════════════════
   Real-Time Product Hook Helper
   ─────────────────────────────────────────────────────────
   Returns an unsubscribe function. Call it in useEffect cleanup.
   ═══════════════════════════════════════════════════════════ */

export function subscribeToProducts(
  q: Query<DocumentData>,
  onData: (products: CatalogProduct[]) => void,
  onError?: (error: Error) => void
): () => void {
  return onSnapshot(
    q,
    (snapshot) => {
      const products: CatalogProduct[] = []
      snapshot.forEach((d) => {
        products.push({ id: d.id, ...d.data() } as CatalogProduct)
      })
      onData(products)
    },
    (error) => {
      console.error("Firestore onSnapshot error:", error)
      onError?.(error)
    }
  )
}

/** Subscribe to all products — real-time */
export function subscribeToAllProducts(
  onData: (products: CatalogProduct[]) => void,
  onError?: (error: Error) => void
): () => void {
  const q = query(collection(db, "products"))
  return subscribeToProducts(q, onData, onError)
}

/** Subscribe to trending products — real-time */
export function subscribeToTrendingProducts(
  maxCount: number,
  onData: (products: CatalogProduct[]) => void,
  onError?: (error: Error) => void
): () => void {
  const q = query(
    collection(db, "products"),
    where("isTrending", "==", true),
    limit(maxCount)
  )
  return subscribeToProducts(q, onData, onError)
}

/** Subscribe to new arrivals — real-time */
export function subscribeToNewArrivalProducts(
  onData: (products: CatalogProduct[]) => void,
  onError?: (error: Error) => void
): () => void {
  const q = query(collection(db, "products"), where("isNewArrival", "==", true))
  return subscribeToProducts(q, onData, onError)
}

/** Subscribe to products by category — real-time */
export function subscribeToProductsByCategory(
  category: string,
  onData: (products: CatalogProduct[]) => void,
  onError?: (error: Error) => void
): () => void {
  const q = query(collection(db, "products"), where("category", "==", category))
  return subscribeToProducts(q, onData, onError)
}

/** Subscribe to top products by category ordered by salesCount — real-time */
export function subscribeToTopProductsByCategory(
  category: string,
  maxCount: number,
  onData: (products: CatalogProduct[]) => void,
  onError?: (error: Error) => void
): () => void {
  const q = query(
    collection(db, "products"),
    where("category", "==", category),
    orderBy("salesCount", "desc"),
    limit(maxCount)
  )
  return subscribeToProducts(q, onData, onError)
}

/* ═══════════════════════════════════════════════════════════
   One-time fetch fallbacks (kept for SSR/server pages or
   places that cannot use hooks)
   ═══════════════════════════════════════════════════════════ */

/** Fetch all products (one-time, no cache) */
export async function getAllProducts(): Promise<CatalogProduct[]> {
  const q = query(collection(db, "products"))
  const snapshot = await getDocs(q)
  const products: CatalogProduct[] = []
  snapshot.forEach((d) => {
    products.push({ id: d.id, ...d.data() } as CatalogProduct)
  })
  return products
}

/** Fetch products by category (one-time, no cache) */
export async function getProductsByCategory(category: string): Promise<CatalogProduct[]> {
  const q = query(collection(db, "products"), where("category", "==", category))
  const snapshot = await getDocs(q)
  const products: CatalogProduct[] = []
  snapshot.forEach((d) => {
    products.push({ id: d.id, ...d.data() } as CatalogProduct)
  })
  return products
}

/** Fetch trending products (one-time, no cache) */
export async function getTrendingProducts(maxCount = 4): Promise<CatalogProduct[]> {
  const q = query(
    collection(db, "products"),
    where("isTrending", "==", true),
    limit(maxCount)
  )
  const snapshot = await getDocs(q)
  const products: CatalogProduct[] = []
  snapshot.forEach((d) => {
    products.push({ id: d.id, ...d.data() } as CatalogProduct)
  })
  return products
}

/** Fetch new arrival products (one-time, no cache) */
export async function getNewArrivalProducts(): Promise<CatalogProduct[]> {
  const q = query(collection(db, "products"), where("isNewArrival", "==", true))
  const snapshot = await getDocs(q)
  const products: CatalogProduct[] = []
  snapshot.forEach((d) => {
    products.push({ id: d.id, ...d.data() } as CatalogProduct)
  })
  return products
}

/** Fetch a single product by slug (30s cache) */
export async function getProductBySlug(slug: string): Promise<{ id: string; data: Record<string, unknown> } | null> {
  const cacheKey = `product-slug-${slug}`
  const cached = getConfigCacheEntry<{ id: string; data: Record<string, unknown> }>(cacheKey)
  if (cached) return cached

  console.log(`Fetching product by slug: ${slug}`);
  const slugQuery = query(collection(db, "products"), where("slug", "==", slug))
  const slugSnap = await getDocs(slugQuery)
  console.log(`Slug query finished. Found: ${!slugSnap.empty}`);

  if (!slugSnap.empty) {
    const docSnap = slugSnap.docs[0]
    const result = { id: docSnap.id, data: docSnap.data() }
    setConfigCacheEntry(cacheKey, result)
    return result
  }

  const docRef = doc(db, "products", slug)
  const docSnap = await getDoc(docRef)
  if (docSnap.exists()) {
    const result = { id: docSnap.id, data: docSnap.data() }
    setConfigCacheEntry(cacheKey, result)
    return result
  }

  return null
}

/** Subscribe to a single product by slug — real-time */
export function subscribeToProductBySlug(
  slug: string,
  onData: (product: { id: string; data: Record<string, unknown> } | null) => void
): () => void {
  const slugQuery = query(collection(db, "products"), where("slug", "==", slug))
  return onSnapshot(slugQuery, (snap) => {
    if (!snap.empty) {
      const d = snap.docs[0]
      onData({ id: d.id, data: d.data() as Record<string, unknown> })
    } else {
      onData(null)
    }
  })
}

/** Fetch featured categories config (30s cache) */
export async function getFeaturedConfig(): Promise<Record<string, unknown> | null> {
  const cacheKey = "featured-categories-config"
  const cached = getConfigCacheEntry<Record<string, unknown>>(cacheKey)
  if (cached) return cached

  const snapshot = await getDoc(doc(db, "settings", "featuredCategories"))
  if (snapshot.exists()) {
    const data = snapshot.data()
    setConfigCacheEntry(cacheKey, data)
    return data
  }
  return null
}

/** Fetch top products by category ordered by salesCount (one-time, no cache) */
export async function getTopProductsByCategory(category: string, maxCount = 5): Promise<CatalogProduct[]> {
  const q = query(
    collection(db, "products"),
    where("category", "==", category),
    orderBy("salesCount", "desc"),
    limit(maxCount)
  )
  const snapshot = await getDocs(q)
  const products: CatalogProduct[] = []
  snapshot.forEach((d) => {
    products.push({ id: d.id, ...d.data() } as CatalogProduct)
  })
  return products
}

/** Fetch categories settings (30s cache) */
export async function getCategoriesConfig(): Promise<Record<string, unknown> | null> {
  const cacheKey = "categories-config"
  const cached = getConfigCacheEntry<Record<string, unknown>>(cacheKey)
  if (cached) return cached

  const snapshot = await getDoc(doc(db, "settings", "categories"))
  if (snapshot.exists()) {
    const data = snapshot.data()
    setConfigCacheEntry(cacheKey, data)
    return data
  }
  return null
}
