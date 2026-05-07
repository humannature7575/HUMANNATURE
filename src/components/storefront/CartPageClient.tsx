"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Trash2, ShoppingBag, Plus, Minus } from "lucide-react"

import { useCartStore } from "@/store/cartStore"
import { routes } from "@/lib/routes"

function formatPrice(value: number): string {
  return value.toLocaleString("tr-TR", {
    style: "currency",
    currency: "TRY",
  })
}

export function CartPageClient() {
  const router = useRouter();
  const items = useCartStore((state) => state.items)
  const removeItem = useCartStore((state) => state.removeItem)
  const updateQuantity = useCartStore((state) => state.updateQuantity)
  const clearCart = useCartStore((state) => state.clearCart)
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <div className="w-full min-h-screen bg-black pt-10 pb-24">
      <div className="container max-w-screen-xl mx-auto px-4 md:px-8">
        <h1 className="text-2xl sm:text-3xl md:text-5xl font-light uppercase tracking-[0.08em] sm:tracking-[0.14em] text-white">
          Sepetim
        </h1>
        <div className="h-px w-full bg-white/10 mt-6 mb-8" />

        {items.length === 0 ? (
          <div className="rounded-sm border border-white/10 bg-white/5 px-4 py-16 text-center">
            <ShoppingBag className="mx-auto mb-4 w-10 h-10 text-white/30" />
            <p className="text-white/60 font-light mb-6">Sepetinizde henüz ürün yok.</p>
            <Link
              href={routes.allProducts}
              className="inline-flex items-center justify-center bg-white text-black hover:bg-white/90 px-8 py-3 text-xs uppercase tracking-widest transition-colors font-medium"
            >
              ALIŞVERİŞE BAŞLA
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-6 lg:gap-8 min-w-0">
            <div className="space-y-4 min-w-0">
              {items.map((item) => (
                <div
                  key={item.cartItemId}
                  className="flex flex-col sm:flex-row gap-4 border border-white/10 bg-white/5 p-4 min-w-0 relative"
                >
                  <div className="flex gap-4 flex-1">
                    <div className="relative w-24 h-32 shrink-0 bg-white/5 rounded-sm overflow-hidden">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="96px"
                        />
                      ) : null}
                    </div>

                    <div className="flex flex-col justify-between flex-1 min-w-0 py-1">
                      <div>
                        <Link href={routes.product(item.id)} className="text-sm md:text-base text-white font-medium line-clamp-2 break-words hover:text-white/70 transition-colors">
                          {item.name}
                        </Link>
                        <div className="flex gap-3 text-[11px] text-white/50 uppercase tracking-widest mt-2">
                          {item.size && <span>Beden: <span className="text-white/80">{item.size}</span></span>}
                          {item.color && <span>Renk: <span className="text-white/80">{item.color}</span></span>}
                        </div>
                      </div>
                      
                      <div className="mt-4 flex items-center justify-between">
                         <div className="flex items-center border border-white/20 rounded-sm overflow-hidden h-9">
                           <button 
                             onClick={() => updateQuantity(item.cartItemId, -1)}
                             className="w-9 h-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                           >
                             <Minus className="w-3 h-3" />
                           </button>
                           <span className="w-10 text-center text-sm text-white font-medium">
                             {item.quantity}
                           </span>
                           <button 
                             onClick={() => updateQuantity(item.cartItemId, 1)}
                             className="w-9 h-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                           >
                             <Plus className="w-3 h-3" />
                           </button>
                         </div>
                         <p className="text-base text-white font-medium">{formatPrice(item.price * item.quantity)}</p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(item.cartItemId)}
                    aria-label="Ürünü kaldır"
                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded text-white/40 hover:text-red-400 hover:bg-white/5 transition-colors touch-manipulation"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <aside className="border border-white/10 bg-white/5 p-5 md:p-6 h-fit lg:sticky lg:top-24 min-w-0">
              <h2 className="text-lg uppercase tracking-wider text-white">SİPARİŞ ÖZETİ</h2>
              <div className="h-px w-full bg-white/10 my-5" />

              <div className="space-y-3">
                <div className="flex items-center justify-between text-white/60 text-sm">
                  <span>Ara Toplam</span>
                  <span>{formatPrice(total)}</span>
                </div>
                <div className="flex items-center justify-between text-white/60 text-sm">
                  <span>Kargo</span>
                  <span>Ücretsiz</span>
                </div>
              </div>

              <div className="h-px w-full bg-white/10 my-5" />

              <div className="flex items-center justify-between text-white text-lg font-medium">
                <span>Genel Toplam</span>
                <span>{formatPrice(total)}</span>
              </div>

              <button
                type="button"
                onClick={() => router.push(routes.checkout)}
                className="w-full mt-8 h-12 bg-white text-black hover:bg-white/90 transition-colors uppercase tracking-widest text-xs font-bold touch-manipulation flex items-center justify-center"
              >
                ÖDEMEYE GEÇ
              </button>

              <button
                type="button"
                onClick={clearCart}
                className="w-full mt-3 h-10 border border-white/20 text-white/60 hover:text-white hover:bg-white/5 transition-colors uppercase tracking-widest text-[10px] touch-manipulation"
              >
                SEPETİ TEMİZLE
              </button>
            </aside>
          </div>
        )}
      </div>
    </div>
  )
}

