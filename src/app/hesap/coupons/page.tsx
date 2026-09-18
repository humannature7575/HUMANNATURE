"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Ticket,
  Copy,
  Check,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  Sparkles,
  Percent,
} from "lucide-react";
import Link from "next/link";
import { routes } from "@/lib/routes";
import { Button } from "@/components/ui/button";

interface UserCoupon {
  id: string;
  code: string;
  discountPercent: number;
  durationDays: number;
  sourceOrderId?: string;
  createdAt?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  expiresAt?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  isUsed?: boolean;
  usedInOrderId?: string;
  status?: string;
}

export default function CouponsPage() {
  const { user } = useAuth();
  const [coupons, setCoupons] = useState<UserCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "active" | "used" | "expired">("all");

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "users", user.uid, "coupons"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as UserCoupon[];
        setCoupons(list);
        setLoading(false);
      },
      (err) => {
        console.error("Coupons fetch error:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const copyToClipboard = async (code: string) => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2500);
    } catch {
      // Fallback
      const textarea = document.createElement("textarea");
      textarea.value = code;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2500);
    }
  };

  const getCouponStatus = (coupon: UserCoupon): "active" | "used" | "expired" => {
    if (coupon.isUsed) return "used";
    if (coupon.expiresAt) {
      const expDate = coupon.expiresAt.toDate
        ? coupon.expiresAt.toDate()
        : new Date(coupon.expiresAt);
      if (new Date() > expDate) return "expired";
    }
    return "active";
  };

  const getRemainingDays = (coupon: UserCoupon): number => {
    if (!coupon.expiresAt) return 0;
    const expDate = coupon.expiresAt.toDate
      ? coupon.expiresAt.toDate()
      : new Date(coupon.expiresAt);
    const diff = expDate.getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const formatExpiryDate = (coupon: UserCoupon): string => {
    if (!coupon.expiresAt) return "";
    const date = coupon.expiresAt.toDate
      ? coupon.expiresAt.toDate()
      : new Date(coupon.expiresAt);
    return date.toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const activeCoupons = coupons.filter((c) => getCouponStatus(c) === "active");
  const usedCoupons = coupons.filter((c) => getCouponStatus(c) === "used");
  const expiredCoupons = coupons.filter((c) => getCouponStatus(c) === "expired");

  const displayedCoupons =
    activeTab === "active"
      ? activeCoupons
      : activeTab === "used"
      ? usedCoupons
      : activeTab === "expired"
      ? expiredCoupons
      : coupons;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-white">
      <div>
        <h2 className="text-xl font-medium tracking-widest uppercase mb-2">KUPONLARIM</h2>
        <p className="text-xs text-white/50">
          Teslimat onaylarından kazandığınız indirim kuponlarınızı buradan yönetebilirsiniz.
        </p>
      </div>

      {/* ── MOTIVATIONAL BANNER ── */}
      <div className="bg-gradient-to-r from-amber-500/15 via-emerald-500/10 to-transparent border border-white/10 rounded-2xl p-5 flex items-start gap-4">
        <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
          <Sparkles className="w-6 h-6" />
        </div>
        <div className="space-y-1 text-xs">
          <p className="font-bold text-white uppercase tracking-wider">
            Alışveriş Yaptıkça Kazanın!
          </p>
          <p className="text-white/70 leading-relaxed">
            1.200 ₺ ve üzeri her siparişinizde, siparişinizi teslim aldıktan sonra{" "}
            <strong className="text-white">&ldquo;Siparişi Teslim Aldım&rdquo;</strong> butonuna tıklayarak{" "}
            <strong className="text-emerald-400">%10 veya %5 indirim kuponu</strong> kazanabilirsiniz!
          </p>
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="flex gap-2 border-b border-white/10 pb-3 overflow-x-auto custom-scrollbar">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
            activeTab === "all" ? "bg-white text-black" : "text-white/60 hover:text-white bg-white/5"
          }`}
        >
          Tümü ({coupons.length})
        </button>
        <button
          onClick={() => setActiveTab("active")}
          className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-1.5 ${
            activeTab === "active"
              ? "bg-emerald-500 text-black font-bold"
              : "text-emerald-400 hover:text-emerald-300 bg-emerald-500/10"
          }`}
        >
          Kullanılabilir ({activeCoupons.length})
        </button>
        <button
          onClick={() => setActiveTab("used")}
          className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
            activeTab === "used" ? "bg-white text-black" : "text-white/60 hover:text-white bg-white/5"
          }`}
        >
          Kullanılmış ({usedCoupons.length})
        </button>
        <button
          onClick={() => setActiveTab("expired")}
          className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
            activeTab === "expired" ? "bg-white text-black" : "text-white/60 hover:text-white bg-white/5"
          }`}
        >
          Süresi Dolan ({expiredCoupons.length})
        </button>
      </div>

      {/* ── COUPONS LIST ── */}
      {displayedCoupons.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedCoupons.map((coupon) => {
            const status = getCouponStatus(coupon);
            const remainingDays = getRemainingDays(coupon);
            const isCopied = copiedCode === coupon.code;

            if (status === "active") {
              return (
                <div
                  key={coupon.id}
                  className="relative overflow-hidden bg-gradient-to-br from-zinc-900 to-black border-2 border-emerald-500/40 hover:border-emerald-400/80 rounded-2xl p-5 space-y-4 transition-all duration-300 shadow-lg shadow-emerald-500/5 group"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-base">
                        <Percent className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 block">
                          %{coupon.discountPercent} İNDİRİM
                        </span>
                        <span className="text-[10px] text-white/50">
                          {coupon.durationDays} Günlük Teslimat Kuponu
                        </span>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                      <Clock className="w-3 h-3" /> {remainingDays} Gün Kaldı
                    </span>
                  </div>

                  {/* Code Card */}
                  <div className="flex items-center justify-between bg-black/70 border border-white/10 rounded-xl p-3">
                    <span className="font-mono font-bold text-base sm:text-lg text-white tracking-widest">
                      {coupon.code}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(coupon.code)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-md shadow-emerald-600/20"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>KOPYALANDI</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>KOPYALA</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-white/40 pt-1 border-t border-white/5">
                    <span>Son Tarih: {formatExpiryDate(coupon)}</span>
                    <Link
                      href={routes.allProducts}
                      className="text-emerald-400 hover:text-emerald-300 font-medium underline uppercase"
                    >
                      Alışverişte Kullan →
                    </Link>
                  </div>
                </div>
              );
            }

            if (status === "used") {
              return (
                <div
                  key={coupon.id}
                  className="bg-zinc-900/40 border border-white/10 rounded-2xl p-5 space-y-3 opacity-60"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-white/40">
                        <CheckCircle2 className="w-5 h-5 text-white/50" />
                      </div>
                      <div>
                        <span className="text-xs font-bold uppercase tracking-widest text-white/60">
                          %{coupon.discountPercent} İNDİRİM
                        </span>
                        <p className="text-[10px] text-white/40">Kullanılmış Kupon</p>
                      </div>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-white/50 bg-white/10 px-2 py-0.5 rounded">
                      Kullanıldı
                    </span>
                  </div>

                  <div className="bg-black/40 border border-white/5 rounded-xl p-3 flex justify-between items-center text-xs">
                    <span className="font-mono text-white/50 line-through">{coupon.code}</span>
                    <span className="text-[10px] text-white/40">
                      {coupon.usedInOrderId ? `Sipariş: #${coupon.usedInOrderId}` : "Kullanıldı"}
                    </span>
                  </div>
                </div>
              );
            }

            // Expired
            return (
              <div
                key={coupon.id}
                className="bg-zinc-900/30 border border-red-500/20 rounded-2xl p-5 space-y-3 opacity-50"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold uppercase tracking-widest text-red-400/80">
                        %{coupon.discountPercent} İNDİRİM
                      </span>
                      <p className="text-[10px] text-white/40">Süresi Dolan Kupon</p>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                    Süresi Doldu
                  </span>
                </div>

                <div className="bg-black/40 border border-white/5 rounded-xl p-3 flex justify-between items-center text-xs">
                  <span className="font-mono text-white/40 line-through">{coupon.code}</span>
                  <span className="text-[10px] text-red-400/60">Kullanım süresi bitti</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 p-12 flex flex-col items-center justify-center text-center rounded-2xl space-y-4">
          <Ticket className="w-12 h-12 text-white/20" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-white">Henüz indirim kuponunuz bulunmuyor</p>
            <p className="text-xs text-white/50 max-w-sm">
              1.200 ₺ ve üzeri siparişlerinizi teslim aldıktan sonra teslimatı onaylayarak hemen kupon kazanabilirsiniz.
            </p>
          </div>
          <Link href={routes.allProducts}>
            <Button className="bg-white text-black hover:bg-white/90 uppercase tracking-widest text-xs h-11 px-8 font-bold mt-2">
              <ShoppingBag className="w-4 h-4 mr-2" /> ALIŞVERİŞE BAŞLA
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
