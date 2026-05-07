"use client";

import { useEffect, useState } from "react";
import { useFavoritesStore } from "@/store/favoritesStore";
import { ProductCard } from "@/components/product/ProductCard";
import { collection, query, where, getDocs, documentId } from "firebase/firestore";
import { routes } from "@/lib/routes";
import { db } from "@/lib/firebase";
import { CatalogProduct } from "@/lib/catalog";
import Link from "next/link";
import { HeartCrack } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FavoritesPage() {
  const { items } = useFavoritesStore();
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavoriteProducts = async () => {
      if (items.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const fetchedProducts: CatalogProduct[] = [];
        
        // Firestore 'in' query has a limit of 30, so we chunk it just in case
        const chunkSize = 30;
        for (let i = 0; i < items.length; i += chunkSize) {
          const chunk = items.slice(i, i + chunkSize);
          const q = query(
            collection(db, "products"),
            where(documentId(), "in", chunk)
          );
          
          const snapshot = await getDocs(q);
          snapshot.docs.forEach(doc => {
            fetchedProducts.push({ id: doc.id, ...doc.data() } as CatalogProduct);
          });
        }
        
        setProducts(fetchedProducts);
      } catch (error) {
        console.error("Error fetching favorite products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFavoriteProducts();
  }, [items]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-medium tracking-widest text-white uppercase mb-8">
        FAVORİLERİM
      </h2>

      {products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              title={product.title}
              imageUrl={product.images[0] || "/placeholder-image.jpg"}
              originalPrice={product.originalPrice}
              discountPrice={product.discountPrice}
              colorCount={product.colorCount}
              stockCount={product.stockCount}
              isFavorite={true}
              trendyolUrl={product.trendyolUrl}
              shopierUrl={product.shopierUrl}
              productCode={product.productCode}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 p-12 flex flex-col items-center justify-center text-center rounded-lg h-[400px]">
          <HeartCrack className="w-12 h-12 text-white/20 mb-4" />
          <p className="text-white/60 mb-6 font-light">
            Henüz favorilere eklediğiniz bir ürün bulunmuyor.
          </p>
          <Link href={routes.allProducts}>
            <Button variant="outline" className="text-black bg-white border-white hover:bg-white/90 uppercase tracking-widest text-xs h-12 px-8">
              ALIŞVERİŞE BAŞLA
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
