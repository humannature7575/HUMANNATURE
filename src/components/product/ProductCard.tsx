"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag, Share2 } from "lucide-react";
import { memo, useState } from "react"; // eslint-disable-line @typescript-eslint/no-unused-vars
import { useCartStore } from "@/store/cartStore";
import { useFavoritesStore } from "@/store/favoritesStore";
import { storeConfig } from "@/lib/storeConfig";
import { routes } from "@/lib/routes";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/* ───────────────────────── Types ───────────────────────── */

interface ProductCardProps {
  /** Unique product identifier */
  id: string;
  /** Primary product image URL */
  imageUrl: string;
  /** Product title (clamped to 2 lines) */
  title: string;
  /** Number of available colors (shows color badge when > 0) */
  colorCount?: number;
  /** Number of items remaining in stock */
  stockCount?: number;
  /** Original price before discount (shown with line-through) */
  originalPrice: number;
  /** Discounted selling price */
  discountPrice: number;
  /** Special price when added to cart (shows red banner) */
  cartPrice?: number;
  /** Whether the product is favorited */
  isFavorite?: boolean;
  /**
   * Custom text for the dark banner.
   * - If provided → overrides the global default
   * - If `null` → explicitly hides the banner
   * - If `undefined` → falls back to `storeConfig.defaultBannerText`
   */
  customBannerText?: string | null;
  /** Custom href for the product detail page. Defaults to routes.product(id) */
  productHref?: string;
  /** Callback when favorite icon is toggled */
  onFavoriteToggle?: (id: string) => void;
  /** Callback when cart icon is clicked */
  onAddToCart?: (id: string) => void;
  /** Trendyol URL */
  trendyolUrl?: string;
  /** Shopier URL */
  shopierUrl?: string;
  /** Product Code */
  productCode?: string;
  /** Whether to prioritize image loading (LCP optimization) */
  priority?: boolean;
  /** Custom sizes attribute for next/image */
  sizes?: string;
}

/* ───────────────────────── Helpers ───────────────────────── */

function formatPrice(price: number): string {
  return price.toLocaleString(storeConfig.currency.locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/* ───────────────────────── Component ───────────────────────── */

export const ProductCard = memo(function ProductCard({
  id,
  imageUrl,
  title,
  colorCount,
  stockCount,
  originalPrice,
  discountPrice,
  cartPrice,
  isFavorite: isFavoriteProp = false,
  customBannerText,
  productHref,
  onFavoriteToggle,
  onAddToCart,
  trendyolUrl,
  shopierUrl,
  productCode,
  priority = false,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw",
}: ProductCardProps) {
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite);
  const isFavoriteStore = useFavoritesStore((state) => state.isFavorite(id));
  
  // Prop override vs store state
  const favorite = isFavoriteProp || isFavoriteStore;

  const addItem = useCartStore((state) => state.addItem);

  const [externalModalOpen, setExternalModalOpen] = useState(false);
  const [activeExternalPlatform, setActiveExternalPlatform] = useState<"trendyol" | "shopier" | null>(null);

  /* ── Banner text logic ── */
  const resolveBannerText = (): string | null => {
    // Show 'Low Stock' warning if stock is between 1 and 5
    if (stockCount !== undefined && stockCount > 0 && stockCount <= 5) {
      return "TÜKENMEK ÜZERE";
    }
    // Prop explicitly provided (including null to hide)
    if (customBannerText !== undefined) return customBannerText;
    // Don't show SADECE ONLINE anymore.
    return null;
  };
  const bannerText = resolveBannerText();

  /* ── Handlers ── */
  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleFavorite(id);
    onFavoriteToggle?.(id);
  };

  const handleCartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id,
      cartItemId: `${id}-Standart-Standart`,
      name: title,
      price: cartPrice && cartPrice > 0 ? cartPrice : discountPrice,
      quantity: 1,
      size: "Standart",
      color: "Standart",
      image: imageUrl,
    });
    onAddToCart?.(id);
  };

  const handleShareClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const shareUrl = `${window.location.origin}${productHref || routes.product(id)}`;
    const shareData = {
      title: title,
      text: `${title} - Human Nature`,
      url: shareUrl,
    };

    const copyToClipboard = async (text: string): Promise<boolean> => {
      // Modern Clipboard API (HTTPS / secure contexts)
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(text);
          return true;
        } catch {
          // fall through to legacy method
        }
      }
      // Legacy fallback (HTTP / older browsers)
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

  /* ── Discount percentage ── */
  const discountPercent =
    originalPrice > discountPrice
      ? Math.round(((originalPrice - discountPrice) / originalPrice) * 100)
      : 0;

  return (
    <div className="group relative flex flex-col bg-white overflow-hidden transition-shadow duration-300 hover:shadow-xl rounded-sm">
      {/* ═══════════ IMAGE WRAPPER ═══════════ */}
      <div className="block relative w-full aspect-[3/4] overflow-hidden bg-neutral-100">
        {/* Product image link */}
        <Link href={productHref || routes.product(id)} className="absolute inset-0 z-0 block">
          <Image
            src={imageUrl}
            alt={title}
            fill
            quality={75}
            priority={priority}
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes={sizes}
          />
        </Link>

        {/* ── Favorite icon (top-right) ── */}
        <button
          onClick={handleFavoriteClick}
          aria-label={favorite ? "Favorilerden çıkar" : "Favorilere ekle"}
          className="absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-md hover:bg-white transition-colors duration-200 touch-manipulation"
        >
          <Heart
            className={`w-4 h-4 transition-colors duration-200 ${
              favorite
                ? "fill-red-500 text-red-500"
                : "fill-none text-neutral-500 hover:text-red-400"
            }`}
          />
        </button>

        {/* ── Discount badge (top-left) ── */}
        {discountPercent > 0 && (
          <span className="absolute top-3 left-3 z-20 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-sm tracking-wide pointer-events-none">
            %{discountPercent}
          </span>
        )}

        {/* ── Banner (bottom edge of image) ── */}
        {bannerText && (
          <div 
            className={`absolute inset-x-0 bottom-0 z-10 py-2 pointer-events-none ${
              bannerText === "TÜKENMEK ÜZERE" 
                ? "bg-gradient-to-r from-neutral-300 via-neutral-100 to-neutral-300 shadow-[0_-2px_10px_rgba(0,0,0,0.1)]" 
                : "bg-[#1a1a2e]"
            }`}
          >
            <p className={`text-center text-[11px] font-bold tracking-[0.15em] uppercase ${
              bannerText === "TÜKENMEK ÜZERE" ? "text-neutral-900" : "text-white"
            }`}>
              {bannerText}
            </p>
          </div>
        )}
      </div>

      {/* ═══════════ ICONS ROW (outside image, always fully visible) ═══════════ */}
      <div className="flex items-center justify-between gap-1 px-2 py-2 bg-neutral-50 border-t border-neutral-100">

        {/* Left: TY + SH + Colors */}
        <div className="flex items-center gap-1 min-w-0 flex-shrink">
          {trendyolUrl && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActiveExternalPlatform("trendyol");
                setExternalModalOpen(true);
              }}
              className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-full bg-[#F27A1A] hover:bg-[#d66a15] transition-colors touch-manipulation"
              title="Trendyol'da Gör"
            >
              <span className="text-[9px] font-bold text-white">TY</span>
            </button>
          )}

          {shopierUrl && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActiveExternalPlatform("shopier");
                setExternalModalOpen(true);
              }}
              className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-full bg-[#1A8B9D] hover:bg-[#146c7a] transition-colors touch-manipulation"
              title="Shopier'de Gör"
            >
              <span className="text-[9px] font-bold text-white">SH</span>
            </button>
          )}

          {colorCount && colorCount > 0 && (
            <div className="flex items-center gap-1 min-w-0">
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{
                  background:
                    "conic-gradient(#e74c3c, #f39c12, #2ecc71, #3498db, #9b59b6, #e74c3c)",
                }}
              />
              <span className="text-[10px] font-medium text-neutral-600 whitespace-nowrap">
                {colorCount} Renk
              </span>
            </div>
          )}
        </div>

        {/* Right: Cart only */}
        <div className="flex items-center flex-shrink-0">
          <button
            onClick={handleCartClick}
            aria-label="Sepete ekle"
            className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-900 hover:bg-neutral-700 transition-colors touch-manipulation shadow-sm"
          >
            <ShoppingBag className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* ═══════════ PRODUCT DETAILS ═══════════ */}
      <div className="flex flex-col items-center px-3 pt-2 pb-2 space-y-1">
        {/* Title */}
        <Link
          href={productHref || routes.product(id)}
          className="text-sm font-bold text-neutral-800 text-center leading-tight line-clamp-2 hover:text-neutral-600 transition-colors"
        >
          {title}
        </Link>

        {/* Pricing row */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {originalPrice > discountPrice && (
            <span className="text-xs text-neutral-400 line-through">
              {formatPrice(originalPrice)} {storeConfig.currency.symbol}
            </span>
          )}
          <span className="text-sm font-bold text-[#8b1a1a]">
            {formatPrice(discountPrice)} {storeConfig.currency.symbol}
          </span>
        </div>

        {/* Share button */}
        <button
          onClick={handleShareClick}
          aria-label="Ürünü paylaş"
          className="flex items-center gap-1 text-[10px] text-neutral-400 hover:text-neutral-600 transition-colors touch-manipulation py-0.5"
        >
          <Share2 className="w-3 h-3" />
          <span>Paylaş</span>
        </button>
      </div>

      {/* ── Cart price banner (red) ── */}
      <div className="w-full bg-[#8b0000] py-2 mt-auto">
        <p className="text-center text-[11px] font-semibold text-white tracking-wide">
          Sepetteki Fiyatı{" "}
          <span className="font-bold text-xs">
            {formatPrice(cartPrice && cartPrice > 0 ? cartPrice : discountPrice)} {storeConfig.currency.symbol}
          </span>
        </p>
      </div>

      {/* ── External Platform Modal ── */}
      <Dialog open={externalModalOpen} onOpenChange={setExternalModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ürünü Platformda Görüntüle</DialogTitle>
            <DialogDescription>
              Bu ürünü seçtiğiniz platform üzerinden detaylı inceleyebilir ve satın alabilirsiniz.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="bg-neutral-50 p-4 rounded-lg flex flex-col gap-1 border border-neutral-100">
              <p className="text-sm text-neutral-500 font-medium">Ürün Kodu</p>
              <p className="font-bold text-neutral-900 font-mono tracking-wide">
                {productCode || "HN-XXXX"}
              </p>
            </div>
            <div className="bg-neutral-50 p-4 rounded-lg flex flex-col gap-1 border border-neutral-100">
              <p className="text-sm text-neutral-500 font-medium">Ürün Adı</p>
              <p className="font-bold text-neutral-900 line-clamp-2">
                {title}
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full mt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setExternalModalOpen(false)}
            >
              İptal
            </Button>
            <Button
              className={`flex-1 text-white ${
                activeExternalPlatform === "trendyol" 
                  ? "bg-[#F27A1A] hover:bg-[#d66a15]" 
                  : "bg-[#1A8B9D] hover:bg-[#146c7a]"
              }`}
              onClick={() => {
                const url = activeExternalPlatform === "trendyol" ? trendyolUrl : shopierUrl;
                if (url) {
                  window.open(url, "_blank", "noopener,noreferrer");
                  setExternalModalOpen(false);
                }
              }}
            >
              {activeExternalPlatform === "trendyol" ? "Trendyol'a Git" : "Shopier'e Git"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
});
