"use client"

import { useEffect, useState } from "react";
import { ProductCard } from "@/components/product/ProductCard"
import Link from "next/link"
import { routes, slugify } from "@/lib/routes"
import { subscribeToTrendingProducts } from "@/lib/firestore-cache"
import { CatalogProduct } from "@/types";

export function TrendingProducts() {
  const [trendingProducts, setTrendingProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToTrendingProducts(
      4,
      (products) => {
        setTrendingProducts(products);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching trending products:", error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <section className="py-20 w-full max-w-screen-2xl mx-auto px-4 md:px-8 border-t border-white/5">
        <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-10 gap-4">
          <h2 className="text-2xl md:text-3xl font-light uppercase tracking-widest text-white text-center md:text-left">
            Trend Ürünler
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((skeleton) => (
            <div key={skeleton} className="aspect-[3/4] w-full bg-white/5 animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (trendingProducts.length === 0) return null;

  return (
    <section className="py-20 w-full max-w-screen-2xl mx-auto px-4 md:px-8 border-t border-white/5">
      <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-10 gap-4">
        <h2 className="text-2xl md:text-3xl font-light uppercase tracking-widest text-white text-center md:text-left">
          Trend Ürünler
        </h2>
        <Link
          href={routes.trending}
          className="text-xs uppercase tracking-widest text-white/60 hover:text-white transition-colors border-b border-white/30 pb-0.5"
        >
          Tümünü Gör
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {trendingProducts.map((product, index) => (
          <ProductCard
            key={product.id}
            id={product.id}
            title={product.title}
            imageUrl={product.imageUrl}
            colorCount={product.colorCount}
            stockCount={product.stockCount}
            originalPrice={product.originalPrice}
            discountPrice={product.discountPrice}
            cartPrice={product.cartPrice}
            productHref={routes.trendProduct(product.slug || slugify(product.title || product.id))}
            trendyolUrl={product.trendyolUrl}
            shopierUrl={product.shopierUrl}
            productCode={product.productCode}
            priority={index < 4}
          />
        ))}
      </div>
    </section>
  )
}
