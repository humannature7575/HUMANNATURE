"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ShoppingBag, Heart, Ruler, Check, Share2 } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useFavoritesStore } from "@/store/favoritesStore";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { routes } from "@/lib/routes";
import Link from "next/link";

/** Known color name → hex mapping for displaying color swatches */
const COLOR_HEX_MAP: Record<string, string> = {
  "siyah": "#000000",
  "beyaz": "#FFFFFF",
  "lacivert": "#0A192F",
  "gri": "#808080",
  "kırmızı": "#C0392B",
  "kirmizi": "#C0392B",
  "mavi": "#2980B9",
  "yeşil": "#27AE60",
  "yesil": "#27AE60",
  "kahverengi": "#6D4C41",
  "bej": "#D4C5A9",
  "bordo": "#800020",
  "haki": "#5D6B3E",
  "turuncu": "#E67E22",
  "pembe": "#E91E8C",
  "sarı": "#F1C40F",
  "sari": "#F1C40F",
  "mor": "#8E44AD",
  "antrasit": "#383838",
  "krem": "#FFFDD0",
  "ekru": "#F0EAD6",
  "camel": "#C19A6B",
  "indigo": "#3F51B5",
  "petrol": "#005F6B",
  "hardal": "#CFAD00",
  "vizon": "#8B7D6B",
};

/** All standard sizes displayed on the product page */
const ALL_STANDARD_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL"];

function getColorHex(colorName: string): string {
  return COLOR_HEX_MAP[colorName.toLowerCase().trim()] || "#888888";
}

function isLightColor(hex: string): boolean {
  const lightColors = ["#FFFFFF", "#FFFDD0", "#F0EAD6", "#D4C5A9", "#F1C40F", "#CFAD00"];
  return lightColors.includes(hex);
}

interface ProductVariant {
  size: string;
  color: string;
  stock: number;
}

interface ColorSibling {
  slug: string;
  colorName: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  variants?: ProductVariant[];
  colorName?: string | null;
  stockCount?: number;
  fabricType?: string | null;
  fit?: string | null;
  tip?: string | null;
  collarType?: string | null;
  productCode?: string | null;
  cartPrice?: number | null;
}

interface ProductInfoProps {
  product: Product;
  /** Sibling products (same groupId, different colors) for color navigation */
  colorSiblings?: ColorSibling[];
  /** Current product slug — to highlight the active color */
  currentSlug?: string;
  /** Section href for building sibling links (e.g. "/giyim") */
  sectionHref?: string;
}

export function ProductInfo({ product, colorSiblings = [], currentSlug, sectionHref }: ProductInfoProps) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Extract available sizes from this product's variants
  const { availableSizes, isInStock } = useMemo(() => {
    const variants = product.variants || [];
    const sizeSet = new Set<string>();

    variants.forEach((v) => {
      if (v.size) sizeSet.add(v.size);
    });

    const hasStock = product.stockCount !== undefined 
      ? product.stockCount > 0 
      : (variants.length === 0 || variants.some((v) => v.stock > 0));

    return {
      availableSizes: sizeSet,
      isInStock: hasStock,
    };
  }, [product.variants, product.stockCount]);

  // Determine which sizes to display: all standard sizes, plus any custom sizes from variants
  const displaySizes = useMemo(() => {
    const sizes = [...ALL_STANDARD_SIZES];
    // Add any non-standard sizes from variants (e.g. "36", "42")
    availableSizes.forEach((s) => {
      if (!sizes.includes(s)) sizes.push(s);
    });
    return sizes;
  }, [availableSizes]);

  // Find first available size as default
  const firstAvailable = displaySizes.find((s) => availableSizes.has(s)) || displaySizes[0] || "M";
  const [selectedSize, setSelectedSize] = useState<string>(firstAvailable);

  // Check if a specific size has stock
  const isSizeAvailable = (size: string): boolean => {
    return availableSizes.has(size) && (product.variants || []).some((v) => v.size === size && v.stock > 0);
  };

  const handleAddToCart = () => {
    if (!isInStock) return;

    addItem({
      id: product.id,
      cartItemId: `${product.id}-${selectedSize}-${product.colorName || "Standart"}`,
      name: `${product.name} - ${selectedSize}`,
      price: product.cartPrice && product.cartPrice > 0 ? product.cartPrice : product.price,
      quantity: 1,
      size: selectedSize,
      color: product.colorName || "Standart",
      image: product.image,
      productCode: product.productCode || undefined,
    });
    
    toast('Sepete Eklendi', {
      description: `${product.name} (${selectedSize}${product.colorName ? `, ${product.colorName}` : ''})`,
      action: {
        label: 'Sepete Git',
        onClick: () => router.push(routes.cart),
      },
    });
  };

  const isFavorite = useFavoritesStore((state) => state.isFavorite(product.id));
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite);

  const handleFavoriteToggle = async () => {
    await toggleFavorite(product.id);
    if (!isFavorite) {
      toast.success("Favorilere eklendi");
    } else {
      toast("Favorilerden çıkarıldı");
    }
  };

  const handleShareClick = async () => {
    const shareUrl = window.location.href;
    const shareData = {
      title: product.name,
      text: `${product.name} - Human Nature`,
      url: shareUrl,
    };

    const copyToClipboard = async (text: string): Promise<boolean> => {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(text);
          return true;
        } catch {
          // fall through
        }
      }
      try {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        const success = document.execCommand("copy");
        document.body.removeChild(textarea);
        return success;
      } catch {
        return false;
      }
    };

    try {
      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
      } else {
        const copied = await copyToClipboard(shareUrl);
        if (copied) {
          toast.success("Bağlantı kopyalandı", {
            description: "Ürün bağlantısı başarıyla panoya kopyalandı.",
          });
        } else {
          toast.error("Kopyalanamadı", {
            description: "Lütfen bağlantıyı manuel olarak kopyalayın: " + shareUrl,
          });
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        const copied = await copyToClipboard(shareUrl);
        if (copied) {
          toast.success("Bağlantı kopyalandı");
        }
      }
    }
  };

  return (
    <div className="flex flex-col space-y-8 sm:space-y-10 w-full">
      
      {/* Title & Price */}
      <div className="space-y-4">
        {product.productCode && (
          <p className="text-xs uppercase tracking-[0.2em] text-white/50 font-medium">
            {product.productCode}
          </p>
        )}
        <h1 className="text-2xl sm:text-3xl md:text-5xl font-light uppercase tracking-[0.08em] sm:tracking-wider text-white break-words">
          {product.name}
        </h1>
        <div className="flex items-center gap-4 flex-wrap">
          <p className="text-xl md:text-2xl text-white/90 font-light">
            {product.price.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
          </p>
          {product.cartPrice && product.cartPrice > 0 && product.cartPrice !== product.price && (
            <p className="text-sm font-bold text-[#8b0000] bg-white/10 px-2 py-1 rounded">
              Sepette: {product.cartPrice.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
            </p>
          )}
          <div className="flex flex-col gap-2">
            <span className={cn(
              "text-xs uppercase tracking-widest font-medium px-3 py-1 rounded-full border w-fit",
              isInStock 
                ? "text-emerald-400 border-emerald-400/30 bg-emerald-400/10" 
                : "text-red-400 border-red-400/30 bg-red-400/10"
            )}>
              {isInStock ? "Stokta Var" : "Tükendi"}
            </span>
            {product.stockCount !== undefined && product.stockCount > 0 && product.stockCount <= 5 && (
              <p className="text-[10px] sm:text-xs font-bold text-amber-500 uppercase tracking-widest">
                Son {product.stockCount} Ürün! Tükenmek Üzere
              </p>
            )}
          </div>
        </div>
        {/* Current color name */}
        {product.colorName && (
          <p className="text-sm text-white/60 uppercase tracking-widest">
            Renk: <span className="text-white/90">{product.colorName}</span>
          </p>
        )}
      </div>

      {/* Description */}
      <div className="text-sm md:text-base text-white/70 font-light leading-relaxed">
        {product.description}
      </div>

      {/* Product Specifications */}
      {(product.fabricType || product.fit || product.tip || product.collarType) && (
        <div className="grid grid-cols-2 gap-x-8 gap-y-4 py-6 border-y border-white/10">
          {product.fabricType && (
            <div className="flex flex-col gap-1">
              <span className="text-[10px] sm:text-xs uppercase tracking-widest text-white/40">Kumaş</span>
              <span className="text-sm text-white/90 font-light">{product.fabricType}</span>
            </div>
          )}
          {product.fit && (
            <div className="flex flex-col gap-1">
              <span className="text-[10px] sm:text-xs uppercase tracking-widest text-white/40">Kalıp</span>
              <span className="text-sm text-white/90 font-light">{product.fit}</span>
            </div>
          )}
          {product.tip && (
            <div className="flex flex-col gap-1">
              <span className="text-[10px] sm:text-xs uppercase tracking-widest text-white/40">Tip</span>
              <span className="text-sm text-white/90 font-light">{product.tip}</span>
            </div>
          )}
          {product.collarType && (
            <div className="flex flex-col gap-1">
              <span className="text-[10px] sm:text-xs uppercase tracking-widest text-white/40">Yaka</span>
              <span className="text-sm text-white/90 font-light">{product.collarType}</span>
            </div>
          )}
        </div>
      )}

      {/* Color Navigation — links to sibling product pages */}
      {colorSiblings.length > 1 && (
        <div className="space-y-4">
          <span className="text-sm uppercase tracking-widest text-white/80">
            Mevcut Renkler
          </span>
          <div className="flex flex-wrap gap-3 sm:gap-4">
            {colorSiblings.map((sibling) => {
              const hex = getColorHex(sibling.colorName);
              const isCurrent = sibling.slug === currentSlug;
              const light = isLightColor(hex);
              const href = sectionHref
                ? `${sectionHref}/${sibling.slug}`
                : `/tum-urunler/${sibling.slug}`;

              return (
                <Link
                  key={sibling.slug}
                  href={href}
                  className={cn(
                    "relative flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-full border transition-all duration-300 touch-manipulation",
                    isCurrent
                      ? "border-white scale-110 ring-2 ring-white/40"
                      : "border-white/20 hover:border-white/50 hover:scale-105"
                  )}
                  title={sibling.colorName}
                >
                  <span
                    className="block w-7 h-7 sm:w-8 sm:h-8 rounded-full pointer-events-none"
                    style={{ backgroundColor: hex }}
                  />
                  {isCurrent && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <Check className={cn("w-4 h-4", light ? "text-black" : "text-white")} strokeWidth={3} />
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Sizes — show ALL standard sizes, highlight available, fade unavailable */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm uppercase tracking-widest text-white/80">
            Beden
          </span>
          <Dialog>
            <DialogTrigger className="text-[11px] sm:text-xs uppercase tracking-[0.12em] sm:tracking-widest flex items-center gap-2 text-white/60 hover:text-white transition-colors p-2 -mr-2 cursor-pointer">
              <Ruler className="w-4 h-4" />
              Beden Tablosu
            </DialogTrigger>
            <DialogContent className="bg-black/95 backdrop-blur-xl border-white/10 text-white sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="uppercase tracking-widest font-light text-xl">
                  Beden Tablosu
                </DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-4 gap-4 text-center mt-6 text-sm">
                <div className="border-b border-white/20 pb-2 text-white/60">Size</div>
                <div className="border-b border-white/20 pb-2 text-white/60">Chest</div>
                <div className="border-b border-white/20 pb-2 text-white/60">Waist</div>
                <div className="border-b border-white/20 pb-2 text-white/60">Length</div>
                
                <div>S</div><div>94</div><div>78</div><div>72</div>
                <div>M</div><div>98</div><div>82</div><div>74</div>
                <div>L</div><div>102</div><div>86</div><div>76</div>
                <div>XL</div><div>106</div><div>90</div><div>78</div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="grid w-full grid-cols-4 sm:grid-cols-7 gap-2 sm:gap-3">
          {displaySizes.map((size) => {
            const available = isSizeAvailable(size);
            const isSelected = selectedSize === size;

            return (
              <button
                key={size}
                type="button"
                onClick={() => available && setSelectedSize(size)}
                disabled={!available}
                className={cn(
                  "h-12 sm:h-14 border transition-all duration-300 touch-manipulation text-sm font-medium tracking-wide",
                  !available && "opacity-25 cursor-not-allowed relative",
                  available && "cursor-pointer active:scale-95",
                  isSelected && available
                    ? "border-white bg-white text-black hover:bg-white/90"
                    : available
                    ? "border-white/20 bg-transparent text-white hover:bg-white/10 hover:border-white/50"
                    : "border-white/10 bg-transparent text-white/30"
                )}
                aria-label={`Beden seç: ${size}`}
                data-testid={`size-${size.toLowerCase()}`}
              >
                {size}
                {/* Diagonal line for unavailable */}
                {!available && (
                  <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="block w-[120%] h-px bg-white/20 rotate-[-20deg]" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 pt-6 sm:flex-row sm:gap-4">
        <Button 
          onClick={handleAddToCart}
          disabled={!isInStock}
          data-testid="add-to-cart-button"
          className={cn(
            "flex-1 min-h-[56px] rounded-none uppercase text-sm tracking-widest font-medium flex items-center justify-center gap-3 transition-colors active:scale-[0.98] cursor-pointer",
            isInStock 
              ? "bg-white text-black hover:bg-white/90" 
              : "bg-white/20 text-white/50 cursor-not-allowed"
          )}
        >
          <ShoppingBag className="w-5 h-5" />
          {isInStock ? "Sepete Ekle" : "Stokta Yok"}
        </Button>
        <Button 
          onClick={handleFavoriteToggle}
          variant="outline" 
          size="icon" 
          className="min-h-[56px] w-full sm:w-14 shrink-0 rounded-none border-white/20 bg-transparent text-white hover:bg-white/10 hover:border-white/50 transition-all active:scale-95 cursor-pointer"
        >
          <Heart className={cn("w-6 h-6", (mounted && isFavorite) ? "fill-red-500 text-red-500" : "text-white")} />
        </Button>
        <Button 
          onClick={handleShareClick}
          variant="outline" 
          size="icon" 
          className="min-h-[56px] w-full sm:w-14 shrink-0 rounded-none border-white/20 bg-transparent text-white hover:bg-white/10 hover:border-white/50 transition-all active:scale-95 cursor-pointer"
        >
          <Share2 className="w-6 h-6" />
        </Button>
      </div>

      {/* Extra Info */}
      <div className="pt-8 border-t border-white/10 space-y-4">
        <div className="flex justify-between items-center text-sm font-light uppercase tracking-wider text-white/80">
          <span>Hızlı Kargo</span>
          <span className="text-white/50">24 Saat İçinde</span>
        </div>
        <div className="flex justify-between items-center text-sm font-light uppercase tracking-wider text-white/80">
          <span>Ücretsiz İade</span>
          <span className="text-white/50">14 Gün İçinde</span>
        </div>
      </div>

    </div>
  );
}
