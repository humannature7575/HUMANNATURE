"use client"

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { routes } from "@/lib/routes";
import {
  collection,
  query,
  where,
  documentId,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getFeaturedConfig, subscribeToTopProductsByCategory } from "@/lib/firestore-cache";

/* ═══════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════ */

interface CategoryConfig {
  mode: "auto" | "manual";
  manualProductIds: string[];
  autoLimit: number;
}

interface FeaturedConfig {
  giyim: CategoryConfig;
  aksesuar: CategoryConfig;
}

interface SliderProduct {
  id: string;
  title: string;
  imageUrl: string;
  slug?: string;
  salesCount?: number;
}

const DEFAULT_CONFIG: FeaturedConfig = {
  giyim: { mode: "auto", manualProductIds: [], autoLimit: 5 },
  aksesuar: { mode: "auto", manualProductIds: [], autoLimit: 5 },
};

/* ═══════════════════════════════════════════════════════════
   CategorySlider — reusable slider for a single category
   ═══════════════════════════════════════════════════════════ */

function CategorySlider({
  categoryKey,
  label,
  href,
  config,
}: {
  categoryKey: string;
  label: string;
  href: string;
  config: CategoryConfig;
}) {
  const [products, setProducts] = useState<SliderProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  /* ── Subscribe to products based on config — real-time ── */
  useEffect(() => {
    setLoading(true);

    let unsubscribe: (() => void) | undefined;

    if (config.mode === "manual" && config.manualProductIds.length > 0) {
      // Manual mode: subscribe to specific products by ID
      const ids = config.manualProductIds.slice(0, 5);
      const q = query(
        collection(db, "products"),
        where(documentId(), "in", ids)
      );
      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const fetched: SliderProduct[] = [];
          snapshot.forEach((d) => {
            const data = d.data();
            fetched.push({
              id: d.id,
              title: data.title ?? "",
              imageUrl: data.imageUrl ?? "",
              slug: data.slug ?? "",
              salesCount: data.salesCount ?? 0,
            });
          });
          // Preserve the manual order
          const ordered = ids
            .map((id) => fetched.find((p) => p.id === id))
            .filter(Boolean) as SliderProduct[];
          setProducts(ordered);
          setLoading(false);
        },
        (error) => {
          console.error(`Error fetching manual products for ${categoryKey}:`, error);
          setLoading(false);
        }
      );
    } else {
      // Auto mode: top products by salesCount — real-time
      const fetchLimit = Math.min(config.autoLimit || 5, 10);
      unsubscribe = subscribeToTopProductsByCategory(
        categoryKey,
        fetchLimit,
        (topProducts) => {
          const mapped: SliderProduct[] = topProducts.map((p) => ({
            id: p.id,
            title: p.title ?? "",
            imageUrl: p.imageUrl ?? "",
            slug: p.slug ?? "",
            salesCount: p.salesCount ?? 0,
          }));
          setProducts(mapped);
          setLoading(false);
        },
        (error) => {
          console.error(`Error fetching auto products for ${categoryKey}:`, error);
          setLoading(false);
        }
      );
    }

    return () => unsubscribe?.();
  }, [categoryKey, config.mode, config.manualProductIds, config.autoLimit]);

  /* ── Auto-advance every 5 seconds ── */
  const advance = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % (products.length || 1));
  }, [products.length]);

  useEffect(() => {
    if (products.length <= 1) return;
    const timer = setInterval(advance, 5000);
    return () => clearInterval(timer);
  }, [advance, products.length]);

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="relative aspect-[3/4] w-full bg-white/5 animate-pulse overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <h3 className="text-white/30 text-2xl md:text-3xl font-light uppercase tracking-[0.2em]">
            {label}
          </h3>
        </div>
      </div>
    );
  }

  /* ── Empty state — "Coming Soon" ── */
  if (products.length === 0) {
    return (
      <div className="relative aspect-[3/4] w-full overflow-hidden group">
        {/* Elegant gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/[0.04] via-transparent to-transparent" />

        {/* Subtle animated shimmer */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,0.05) 35px, rgba(255,255,255,0.05) 70px)",
          }}
        />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8 gap-6">
          {/* Category label */}
          <h3 className="text-white/90 text-2xl md:text-3xl font-light uppercase tracking-[0.2em]">
            {label}
          </h3>

          {/* Decorative line */}
          <div className="w-12 h-px bg-white/20" />

          {/* Coming soon message */}
          <p className="text-white/40 text-sm md:text-base font-light leading-relaxed max-w-xs tracking-wide">
            En yeni aksesuarlarımız yolda!
            <br />
            Çok yakında burada olacağız.
          </p>

          {/* Subtle icon */}
          <div className="mt-2 w-10 h-10 rounded-full border border-white/10 flex items-center justify-center">
            <svg
              className="w-4 h-4 text-white/20"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  /* ── Slider with crossfade ── */
  return (
    <Link
      href={href}
      className="relative aspect-[3/4] w-full overflow-hidden block group"
    >
      {/* Stacked images — all absolutely positioned, only active one is visible */}
      {products.map((product, index) => (
        <div
          key={product.id}
          className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
          style={{ opacity: index === currentIndex ? 1 : 0 }}
        >
          <Image
            src={product.imageUrl}
            alt={product.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority={index === 0}
          />
        </div>
      ))}

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors duration-500" />

      {/* Category label — centered */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <h3 className="text-white text-2xl sm:text-3xl md:text-4xl font-light tracking-[0.14em] md:tracking-[0.2em] uppercase text-center">
          {label}
        </h3>
      </div>

      {/* Slide indicators */}
      {products.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 pointer-events-none">
          {products.map((_, i) => (
            <span
              key={i}
              className={`block w-1.5 h-1.5 rounded-full transition-all duration-500 ${
                i === currentIndex
                  ? "bg-white/90 scale-125"
                  : "bg-white/30"
              }`}
            />
          ))}
        </div>
      )}

      {/* "Shop Now" hover CTA */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <span className="text-xs uppercase tracking-widest text-white border-b border-white pb-1">
          Alışverişe Başla
        </span>
      </div>
    </Link>
  );
}

/* ═══════════════════════════════════════════════════════════
   FeaturedCategories — parent wrapper
   ═══════════════════════════════════════════════════════════ */

export function FeaturedCategories() {
  const [config, setConfig] = useState<FeaturedConfig>(DEFAULT_CONFIG);
  const [configLoading, setConfigLoading] = useState(true);

  /* ── Fetch admin config from Firestore (CACHED) ── */
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const data = await getFeaturedConfig();
        if (data) {
          setConfig({
            giyim: {
              mode: (data?.giyim as any)?.mode ?? "auto",
              manualProductIds: (data?.giyim as any)?.manualProductIds ?? [],
              autoLimit: (data?.giyim as any)?.autoLimit ?? 5,
            },
            aksesuar: {
              mode: (data?.aksesuar as any)?.mode ?? "auto",
              manualProductIds: (data?.aksesuar as any)?.manualProductIds ?? [],
              autoLimit: (data?.aksesuar as any)?.autoLimit ?? 5,
            },
          });
        }
      } catch (error) {
        console.error("Error fetching featured categories config:", error);
      } finally {
        setConfigLoading(false);
      }
    };

    fetchConfig();
  }, []);

  /* ── Loading state ── */
  if (configLoading) {
    return (
      <section className="py-20 md:py-32 w-full max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex justify-center mb-10">
          <h2 className="text-2xl md:text-4xl font-light uppercase tracking-[0.12em] sm:tracking-widest text-white">
            Öne Çıkan Kategoriler
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {[1, 2].map((skeleton) => (
            <div
              key={skeleton}
              className="aspect-[3/4] w-full bg-white/5 animate-pulse"
            />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 md:py-32 w-full max-w-7xl mx-auto px-4 md:px-8">
      {/* Section heading — centered */}
      <div className="flex justify-center mb-10">
        <h2 className="text-2xl md:text-4xl font-light uppercase tracking-[0.12em] sm:tracking-widest text-white text-center">
          Öne Çıkan Kategoriler
        </h2>
      </div>

      {/* 2-column grid (desktop), 1-column (mobile) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        <CategorySlider
          categoryKey="giyim"
          label="GİYİM"
          href={routes.clothing}
          config={config.giyim}
        />
        <CategorySlider
          categoryKey="aksesuar"
          label="AKSESUAR"
          href={routes.accessories}
          config={config.aksesuar}
        />
      </div>
    </section>
  );
}
