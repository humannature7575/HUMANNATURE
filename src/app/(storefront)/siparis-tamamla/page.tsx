"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { useCartStore } from "@/store/cartStore";
import {
  collection,
  query,
  getDocs,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  orderBy,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  MapPin,
  Plus,
  ShoppingBag,
  CheckCircle,
  ShieldCheck,
  X,
  Copy,
  ExternalLink,
  Sparkles,
  Ticket,
  Percent,
  Check,
  ChevronRight,
  Gift,
} from "lucide-react";
import Image from "next/image";
import { routes } from "@/lib/routes";
import { Button } from "@/components/ui/button";

function formatPrice(value: number): string {
  return value.toLocaleString("tr-TR", { style: "currency", currency: "TRY" });
}

interface PaymentSettings {
  trendyol?: { enabled: boolean; link: string; description: string };
  shopier?: { enabled: boolean; link: string; description: string };
  bank?: {
    enabled: boolean;
    bankName: string;
    accountHolder: string;
    iban: string;
    whatsappNumber: string;
    description: string;
    barcodeImage?: string;
  };
  cod?: { enabled: boolean; extraFeePercent: number; description: string };
}

interface CouponSettings {
  enabled?: boolean;
  minOrderAmount?: number;
  optionAPercent?: number;
  optionADays?: number;
  optionBPercent?: number;
  optionBDays?: number;
}

interface UserCoupon {
  id: string;
  code: string;
  discountPercent: number;
  durationDays: number;
  expiresAt?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  isUsed?: boolean;
}

type PaymentMethod = "trendyol" | "shopier" | "bank" | "cod";
type CartItemWithProductCode = { productCode?: string };

const METHOD_STYLES: Record<
  PaymentMethod,
  { color: string; bg: string; border: string; label: string; icon: string }
> = {
  trendyol: {
    color: "#FF6000",
    bg: "rgba(255,96,0,0.1)",
    border: "rgba(255,96,0,0.4)",
    label: "Trendyol",
    icon: "🛒",
  },
  shopier: {
    color: "#00C853",
    bg: "rgba(0,200,83,0.1)",
    border: "rgba(0,200,83,0.4)",
    label: "Shopier",
    icon: "🏪",
  },
  bank: {
    color: "#1565C0",
    bg: "rgba(21,101,192,0.1)",
    border: "rgba(21,101,192,0.4)",
    label: "Banka Havalesi / EFT",
    icon: "🏦",
  },
  cod: {
    color: "#FFC107",
    bg: "rgba(255,193,7,0.1)",
    border: "rgba(255,193,7,0.4)",
    label: "Kapıda Ödeme",
    icon: "🏠",
  },
};

export default function CheckoutPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const [addresses, setAddresses] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [formData, setFormData] = useState({
    title: "Ev",
    fullName: "",
    phone: "",
    city: "",
    district: "",
    fullAddress: "",
  });

  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({});
  const [couponSettings, setCouponSettings] = useState<CouponSettings>({
    enabled: true,
    minOrderAmount: 1200,
    optionAPercent: 10,
    optionADays: 30,
    optionBPercent: 5,
    optionBDays: 60,
  });

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isStoreReady, setIsStoreReady] = useState(false);

  // ── Coupon State ──
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountPercent: number;
    discountAmount: number;
  } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [userCoupons, setUserCoupons] = useState<UserCoupon[]>([]);
  const [showCouponsModal, setShowCouponsModal] = useState(false);

  // ── Reward Option Selection (Option A vs Option B) ──
  const [selectedRewardOption, setSelectedRewardOption] = useState<"optionA" | "optionB">("optionA");

  // Wait for both React hydration AND Zustand persist hydration from localStorage
  useEffect(() => {
    setIsHydrated(true);
    if (useCartStore.persist.hasHydrated()) {
      setIsStoreReady(true);
    } else {
      const unsub = useCartStore.persist.onFinishHydration(() => {
        setIsStoreReady(true);
      });
      return () => unsub();
    }
  }, []);

  // Init form defaults from profile
  useEffect(() => {
    if (profile) {
      setFormData((f) => ({
        ...f,
        fullName: f.fullName || `${profile.firstName || ""} ${profile.lastName || ""}`.trim(),
        phone: f.phone || profile.phone || "",
      }));
    }
  }, [profile]);

  useEffect(() => {
    if (isHydrated && isStoreReady && items.length === 0 && !placingOrder) {
      router.push(routes.cart);
    }
  }, [items, router, placingOrder, isHydrated, isStoreReady]);

  useEffect(() => {
    if (user) fetchAddresses();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch payment & coupon settings from Firestore
  useEffect(() => {
    (async () => {
      try {
        const [paySnap, coupSnap] = await Promise.all([
          getDoc(doc(db, "settings", "paymentMethods")),
          getDoc(doc(db, "settings", "coupons")),
        ]);
        if (paySnap.exists()) setPaymentSettings(paySnap.data() as PaymentSettings);
        if (coupSnap.exists()) setCouponSettings((prev) => ({ ...prev, ...coupSnap.data() }));
      } catch (e) {
        console.error("Error fetching settings:", e);
      }
    })();
  }, []);

  // Fetch user's active coupons
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const q = query(
          collection(db, "users", user.uid, "coupons"),
          where("isUsed", "==", false)
        );
        const snap = await getDocs(q);
        const validList: UserCoupon[] = [];
        const now = new Date();
        snap.docs.forEach((d) => {
          const c = { id: d.id, ...d.data() } as UserCoupon;
          if (c.expiresAt) {
            const exp = c.expiresAt.toDate ? c.expiresAt.toDate() : new Date(c.expiresAt);
            if (now <= exp) {
              validList.push(c);
            }
          } else {
            validList.push(c);
          }
        });
        setUserCoupons(validList);
      } catch (e) {
        console.error("Error fetching user coupons:", e);
      }
    })();
  }, [user]);

  const fetchAddresses = async () => {
    if (!user) return;
    try {
      const q = query(
        collection(db, "users", user.uid, "addresses"),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      const fetched: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any
      snapshot.docs.forEach((d) => fetched.push({ id: d.id, ...d.data() }));
      fetched.sort((a, b) => (a.isDefault === b.isDefault ? 0 : a.isDefault ? -1 : 1));
      setAddresses(fetched);
      if (fetched.length > 0) setSelectedAddressId(fetched[0].id);
      else setIsAddingAddress(true);
    } catch (error) {
      console.error("Error fetching addresses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const docRef = await addDoc(collection(db, "users", user.uid, "addresses"), {
        ...formData,
        isDefault: addresses.length === 0,
        createdAt: serverTimestamp(),
      });
      await fetchAddresses();
      setIsAddingAddress(false);
      setSelectedAddressId(docRef.id);
    } catch (error) {
      console.error("Error saving address:", error);
    }
  };

  const enabledMethods = (Object.keys(METHOD_STYLES) as PaymentMethod[]).filter(
    (m) => paymentSettings[m]?.enabled
  );

  // ── Calculation logic ──
  const minSpendThreshold = couponSettings.minOrderAmount ?? 1200;
  const isEligibleForReward = total >= minSpendThreshold;
  const remainingForReward = Math.max(0, minSpendThreshold - total);

  const discountAmount = appliedCoupon
    ? Math.round((total * appliedCoupon.discountPercent) / 100)
    : 0;
  const subtotalAfterDiscount = Math.max(0, total - discountAmount);

  const codFee = paymentSettings.cod?.extraFeePercent ?? 7;
  const codExtra = selectedMethod === "cod" ? Math.round((subtotalAfterDiscount * codFee) / 100) : 0;
  const grandTotal = subtotalAfterDiscount + codExtra;

  // Selected reward coupon specs
  const selectedRewardDetails =
    selectedRewardOption === "optionA"
      ? {
          percent: couponSettings.optionAPercent ?? 10,
          durationDays: couponSettings.optionADays ?? 30,
        }
      : {
          percent: couponSettings.optionBPercent ?? 5,
          durationDays: couponSettings.optionBDays ?? 60,
        };

  // ── Apply Coupon Handlers ──
  const handleApplyCouponCode = async (codeToApply?: string) => {
    const code = (codeToApply || couponCodeInput).trim().toUpperCase();
    if (!code) return;
    if (!user) {
      setCouponError("Kupon kullanabilmek için giriş yapmalısınız.");
      return;
    }

    setCouponLoading(true);
    setCouponError(null);

    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();
      if (!res.ok) {
        setCouponError(data.error || "Geçersiz kupon kodu.");
        return;
      }

      const discAmt = Math.round((total * (data.discountPercent || 10)) / 100);
      setAppliedCoupon({
        code: data.code || code,
        discountPercent: data.discountPercent || 10,
        discountAmount: discAmt,
      });
      setCouponCodeInput("");
      setShowCouponsModal(false);
    } catch (e) {
      console.error(e);
      setCouponError("Kupon doğrulanırken bir hata oluştu.");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
  };

  const handleConfirmOrder = () => {
    if (!selectedMethod || !selectedAddressId) return;
    if (selectedMethod === "bank") {
      handleBankConfirm();
    } else if (selectedMethod === "cod") {
      handleCodConfirm();
    } else {
      setShowModal(true);
    }
  };

  const createFirestoreOrder = async (method: string) => {
    if (!user) return null;
    const selectedAddress = addresses.find((a) => a.id === selectedAddressId);
    const enrichedItems = await Promise.all(
      items.map(async (item) => {
        let code = (item as CartItemWithProductCode).productCode;
        if (!code) {
          try {
            const snap = await getDoc(doc(db, "products", item.id));
            if (snap.exists() && snap.data().productCode) {
              code = snap.data().productCode;
            } else {
              code = item.id;
            }
          } catch {
            code = item.id;
          }
        }
        return {
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
          image: item.image,
          productCode: code,
        };
      })
    );

    const orderData = {
      userId: user.uid,
      customerName:
        selectedAddress?.fullName ||
        `${profile?.firstName || ""} ${profile?.lastName || ""}`.trim() ||
        "Müşteri",
      customerPhone: selectedAddress?.phone || "",
      items: enrichedItems,
      subtotal: total,
      discountAmount,
      appliedCoupon: appliedCoupon
        ? {
            code: appliedCoupon.code,
            discountPercent: appliedCoupon.discountPercent,
            discountAmount,
          }
        : null,
      selectedRewardCoupon: isEligibleForReward ? selectedRewardDetails : null,
      extraFee: codExtra,
      total: grandTotal,
      status: method === "cod" ? "Onay Bekleniyor" : "Ödeme Bekleniyor",
      paymentMethod: method,
      address: selectedAddress,
      isRead: false,
    };

    const token = await user.getIdToken();
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ orderData }),
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }
    const result = (await response.json()) as { orderId: string };

    clearCart();
    return { orderId: result.orderId, enrichedItems };
  };

  // ── Modal Actions ──
  const handleRedirect = (link: string) => {
    setShowModal(false);
    window.open(link, "_blank");
  };

  const handleBankConfirm = async () => {
    setPlacingOrder(true);
    try {
      const orderResult = await createFirestoreOrder("bank");
      if (!orderResult) return;
      const { orderId } = orderResult;
      const selectedAddress = addresses.find((a) => a.id === selectedAddressId);
      const customerName =
        selectedAddress?.fullName ||
        `${profile?.firstName || ""} ${profile?.lastName || ""}`.trim() ||
        "Müşteri";
      setShowModal(false);
      router.push(
        `${routes.checkout}/success?method=bank&orderId=${encodeURIComponent(
          orderId
        )}&total=${grandTotal}&customer=${encodeURIComponent(customerName)}`
      );
    } catch (e) {
      console.error(e);
      alert("Sipariş oluşturulurken bir hata oluştu. Lütfen tekrar deneyiniz.");
      setPlacingOrder(false);
    }
  };

  const handleCodConfirm = async () => {
    setPlacingOrder(true);
    try {
      const orderResult = await createFirestoreOrder("cod");
      if (!orderResult) return;
      const { orderId } = orderResult;
      setShowModal(false);
      router.push(
        `${routes.checkout}/success?method=cod&orderId=${encodeURIComponent(
          orderId
        )}&total=${grandTotal}`
      );
    } catch (e) {
      console.error(e);
      alert("Sipariş oluşturulurken bir hata oluştu. Lütfen tekrar deneyiniz.");
      setPlacingOrder(false);
    }
  };

  const copyText = async (text: string, field: string) => {
    if (!text) return;
    let success = false;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        success = true;
      } catch {
        /* fallback */
      }
    }
    if (!success) {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        success = document.execCommand("copy");
        document.body.removeChild(textarea);
      } catch {
        /* ignore */
      }
    }
    if (success) {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  // ── Auth Guard ──
  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-4">
        <ShieldCheck className="w-16 h-16 text-white/30 mb-6" />
        <h1 className="text-2xl font-light text-white tracking-widest uppercase mb-4">
          GÜVENLİ ÖDEME
        </h1>
        <p className="text-white/60 mb-8 max-w-md">
          Siparişinize devam edebilmek için hesabınıza giriş yapmanız gerekmektedir.
        </p>
        <Button
          onClick={() => router.push(routes.login)}
          className="bg-white text-black hover:bg-white/90 uppercase tracking-widest px-10 h-14"
        >
          GİRİŞ YAP VEYA KAYIT OL
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (user && profile && !profile.phone) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-4">
        <ShieldCheck className="w-16 h-16 text-white/30 mb-6" />
        <h1 className="text-2xl font-light text-white tracking-widest uppercase mb-4 text-center">
          TELEFON NUMARASI GEREKLİ
        </h1>
        <p className="text-white/60 mb-8 max-w-md text-center">
          Siparişinize devam edebilmek için hesap bilgilerinize bir telefon numarası eklemeniz
          gerekmektedir. Lütfen hesap ayarlarından numaranızı kaydedin.
        </p>
        <Button
          onClick={() => router.push(routes.account)}
          className="bg-white text-black hover:bg-white/90 uppercase tracking-widest px-10 h-14"
        >
          HESABIMA GİT
        </Button>
      </div>
    );
  }

  const productCodes = items
    .map((i) => ((i as any).productCode ? (i as any).productCode : "KOD YOK")) // eslint-disable-line @typescript-eslint/no-explicit-any
    .filter(Boolean)
    .join(", ");

  return (
    <div className="w-full min-h-screen bg-black pt-10 pb-24 text-white">
      <div className="container max-w-screen-xl mx-auto px-4 md:px-8">
        <h1 className="text-2xl sm:text-3xl font-light uppercase tracking-widest text-white mb-2">
          SİPARİŞ TAMAMLA
        </h1>
        <p className="text-white/50 text-sm mb-10">
          Adres ve ödeme yönteminizi seçerek siparişinizi tamamlayın.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_400px] gap-8">
          <div className="space-y-8">
            {/* ── ADDRESS SECTION ── */}
            <section className="bg-white/5 border border-white/10 p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10 text-white">
                <MapPin className="w-5 h-5 text-white/70" />
                <h2 className="text-lg uppercase tracking-widest font-medium">1. TESLİMAT ADRESİ</h2>
              </div>
              {isAddingAddress ? (
                <form
                  onSubmit={handleSaveAddress}
                  className="space-y-5 animate-in fade-in slide-in-from-top-4 duration-500"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs uppercase tracking-widest text-white/50">
                        Adres Başlığı
                      </label>
                      <input
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full bg-black border border-white/20 px-4 py-3 text-white text-sm focus:outline-none focus:border-white transition-colors"
                        placeholder="Ev, İş vb."
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs uppercase tracking-widest text-white/50">
                        Ad Soyad
                      </label>
                      <input
                        required
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="w-full bg-black border border-white/20 px-4 py-3 text-white text-sm focus:outline-none focus:border-white transition-colors"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs uppercase tracking-widest text-white/50">
                        Telefon
                      </label>
                      <input
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full bg-black border border-white/20 px-4 py-3 text-white text-sm focus:outline-none focus:border-white transition-colors"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs uppercase tracking-widest text-white/50">
                        İl / İlçe
                      </label>
                      <div className="flex gap-2">
                        <input
                          required
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          placeholder="İl"
                          className="w-1/2 bg-black border border-white/20 px-4 py-3 text-white text-sm focus:outline-none focus:border-white transition-colors"
                        />
                        <input
                          required
                          value={formData.district}
                          onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                          placeholder="İlçe"
                          className="w-1/2 bg-black border border-white/20 px-4 py-3 text-white text-sm focus:outline-none focus:border-white transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs uppercase tracking-widest text-white/50">
                      Açık Adres
                    </label>
                    <textarea
                      required
                      rows={2}
                      value={formData.fullAddress}
                      onChange={(e) => setFormData({ ...formData, fullAddress: e.target.value })}
                      className="w-full bg-black border border-white/20 px-4 py-3 text-white text-sm focus:outline-none focus:border-white transition-colors resize-none"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    {addresses.length > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setIsAddingAddress(false)}
                        className="text-white hover:bg-white/10 uppercase tracking-widest text-xs"
                      >
                        İPTAL
                      </Button>
                    )}
                    <Button
                      type="submit"
                      className="bg-white text-black hover:bg-white/90 uppercase tracking-widest text-xs px-8"
                    >
                      KAYDET VE SEÇ
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {addresses.map((address) => (
                      <div
                        key={address.id}
                        onClick={() => setSelectedAddressId(address.id)}
                        className={`p-4 border rounded cursor-pointer transition-all ${
                          selectedAddressId === address.id
                            ? "border-white bg-white/10"
                            : "border-white/20 bg-black hover:border-white/40"
                        }`}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-white">{address.title}</span>
                          {selectedAddressId === address.id && (
                            <CheckCircle className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <div className="text-xs text-white/70 space-y-1">
                          <p>
                            {address.fullName} - {address.phone}
                          </p>
                          <p className="line-clamp-2">{address.fullAddress}</p>
                          <p>
                            {address.district} / {address.city}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setIsAddingAddress(true)}
                    className="w-full border-white/20 text-white hover:bg-white/10 uppercase tracking-widest mt-2 h-12"
                  >
                    <Plus className="w-4 h-4 mr-2" /> YENİ ADRES EKLE
                  </Button>
                </div>
              )}
            </section>

            {/* ── LOYALTY REWARD SELECTION / THRESHOLD NOTICE ── */}
            {couponSettings.enabled !== false && (
              <section className="bg-white/5 border border-white/10 p-6 sm:p-8 space-y-5 rounded-xl">
                <div className="flex items-center gap-3 border-b border-white/10 pb-4 text-white">
                  <Gift className="w-5 h-5 text-amber-400" />
                  <div>
                    <h2 className="text-base uppercase tracking-widest font-semibold">
                      2. TESLİMAT HEDİYE KUPONU
                    </h2>
                    <p className="text-[11px] text-white/50">
                      Teslimatı onayladığınızda hesabınıza eklenecek indirim kuponunuzu seçin.
                    </p>
                  </div>
                </div>

                {isEligibleForReward ? (
                  <div className="space-y-3">
                    <p className="text-xs text-white/70">
                      🎉 <strong>Tebrikler!</strong> Sepetiniz {formatPrice(minSpendThreshold)} üzerinde olduğu için teslimat sonrası indirim kuponu kazanmaya hak kazandınız:
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {/* Option A */}
                      <div
                        onClick={() => setSelectedRewardOption("optionA")}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          selectedRewardOption === "optionA"
                            ? "border-emerald-500 bg-emerald-500/10"
                            : "border-white/10 bg-black/40 hover:border-white/20"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-bold text-emerald-400">
                            %{couponSettings.optionAPercent ?? 10} İNDİRİM
                          </span>
                          <span className="text-[10px] uppercase font-semibold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">
                            {couponSettings.optionADays ?? 30} Gün Geçerli
                          </span>
                        </div>
                        <p className="text-[11px] text-white/60">
                          Hızlı alışverişler için yüksek indirim oranı.
                        </p>
                      </div>

                      {/* Option B */}
                      <div
                        onClick={() => setSelectedRewardOption("optionB")}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          selectedRewardOption === "optionB"
                            ? "border-emerald-500 bg-emerald-500/10"
                            : "border-white/10 bg-black/40 hover:border-white/20"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-bold text-emerald-400">
                            %{couponSettings.optionBPercent ?? 5} İNDİRİM
                          </span>
                          <span className="text-[10px] uppercase font-semibold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">
                            {couponSettings.optionBDays ?? 60} Gün Geçerli
                          </span>
                        </div>
                        <p className="text-[11px] text-white/60">
                          Daha uzun vadeli kullanım için esnek süre.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider">
                      <Sparkles className="w-4 h-4" /> Hediye Kupon Kazanma Fırsatı
                    </div>
                    <p className="text-xs text-white/80 leading-relaxed">
                      Sepetinize <strong className="text-white underline decoration-amber-400">{formatPrice(remainingForReward)}</strong> değerinde ürün daha ekleyin, teslimat sonrasında bir sonraki siparişiniz için <strong className="text-amber-300">%10 veya %5 indirim kuponu</strong> kazanın!
                    </p>
                  </div>
                )}
              </section>
            )}

            {/* ── PAYMENT METHOD SELECTION ── */}
            <section
              className={`bg-white/5 border border-white/10 p-6 sm:p-8 transition-opacity duration-300 rounded-xl ${
                !selectedAddressId || isAddingAddress ? "opacity-50 pointer-events-none" : ""
              }`}
            >
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10 text-white">
                <ShieldCheck className="w-5 h-5 text-white/70" />
                <h2 className="text-lg uppercase tracking-widest font-medium">3. ÖDEME YÖNTEMİ</h2>
              </div>
              {enabledMethods.length === 0 ? (
                <p className="text-white/50 text-sm text-center py-8">
                  Şu anda aktif ödeme yöntemi bulunmamaktadır.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {enabledMethods.map((method) => {
                    const s = METHOD_STYLES[method];
                    const isSelected = selectedMethod === method;
                    return (
                      <button
                        key={method}
                        onClick={() => setSelectedMethod(method)}
                        className="text-left p-5 rounded-lg border-2 transition-all duration-300 cursor-pointer"
                        style={{
                          borderColor: isSelected ? s.border : "rgba(255,255,255,0.1)",
                          background: isSelected ? s.bg : "transparent",
                        }}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">{s.icon}</span>
                          <span className="text-white font-semibold text-sm">{s.label}</span>
                        </div>
                        <p className="text-white/50 text-xs leading-relaxed">
                          {paymentSettings[method]?.description || ""}
                        </p>
                        {method === "cod" && (
                          <p className="mt-2 text-xs font-medium" style={{ color: s.color }}>
                            +%{codFee} ek ücret uygulanır
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {/* ── ORDER SUMMARY & COUPON APPLICATION ── */}
          <div>
            <aside className="border border-white/10 bg-white/5 p-6 h-fit lg:sticky lg:top-24 rounded-xl space-y-5">
              <div className="flex items-center gap-3 pb-4 border-b border-white/10 text-white">
                <ShoppingBag className="w-5 h-5 text-white/70" />
                <h2 className="text-lg uppercase tracking-widest font-medium">SİPARİŞ ÖZETİ</h2>
              </div>

              {/* Items List */}
              <div className="space-y-4 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                {items.map((item) => (
                  <div key={item.cartItemId} className="flex gap-4">
                    <div className="relative w-14 h-18 bg-white/10 shrink-0 rounded-sm overflow-hidden">
                      {item.image && (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                      )}
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <p className="text-xs text-white font-medium line-clamp-1">{item.name}</p>
                      <div className="text-[10px] text-white/50 uppercase tracking-widest mt-1 flex gap-2">
                        <span>{item.size}</span> | <span>{item.color}</span> |{" "}
                        <span>{item.quantity} ADET</span>
                      </div>
                      <p className="text-xs font-medium text-white mt-1">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── COUPON CODE BOX ── */}
              <div className="border-t border-white/10 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-white/70 font-semibold flex items-center gap-1.5">
                    <Ticket className="w-3.5 h-3.5 text-emerald-400" /> İndirim Kuponu
                  </span>
                  {userCoupons.length > 0 && !appliedCoupon && (
                    <button
                      type="button"
                      onClick={() => setShowCouponsModal(true)}
                      className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold underline uppercase"
                    >
                      Kuponlarımdan Seç ({userCoupons.length})
                    </button>
                  )}
                </div>

                {appliedCoupon ? (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-xs text-emerald-400">
                        {appliedCoupon.code}
                      </span>
                      <p className="text-[10px] text-white/70">
                        %{appliedCoupon.discountPercent} İndirim Uygulandı
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="p-1 hover:bg-white/10 rounded text-white/60 hover:text-white"
                      title="Kuponu Kaldır"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex gap-2">
                      <input
                        value={couponCodeInput}
                        onChange={(e) => setCouponCodeInput(e.target.value)}
                        placeholder="Kupon Kodu"
                        className="w-full bg-black border border-white/20 px-3 py-2 text-xs text-white uppercase focus:outline-none focus:border-white font-mono rounded"
                      />
                      <Button
                        type="button"
                        onClick={() => handleApplyCouponCode()}
                        disabled={couponLoading || !couponCodeInput.trim()}
                        className="bg-white text-black hover:bg-white/90 text-xs px-4 h-auto font-bold uppercase"
                      >
                        {couponLoading ? "..." : "UYGULA"}
                      </Button>
                    </div>
                    {couponError && <p className="text-[10px] text-red-400">{couponError}</p>}
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="border-t border-white/10 pt-4 space-y-2.5">
                <div className="flex items-center justify-between text-white/60 text-xs">
                  <span>Ara Toplam</span>
                  <span>{formatPrice(total)}</span>
                </div>

                {appliedCoupon && (
                  <div className="flex items-center justify-between text-emerald-400 text-xs font-semibold">
                    <span>Kupon İndirimi (%{appliedCoupon.discountPercent})</span>
                    <span>-{formatPrice(discountAmount)}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-white/60 text-xs">
                  <span>Kargo</span>
                  <span>Ücretsiz</span>
                </div>

                {codExtra > 0 && (
                  <div className="flex items-center justify-between text-xs" style={{ color: "#FFC107" }}>
                    <span>Kapıda Ödeme Ücreti (%{codFee})</span>
                    <span>+{formatPrice(codExtra)}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-white/10 pt-4 flex items-center justify-between text-white text-lg font-bold">
                <span>Ödenecek Tutar</span>
                <span>{formatPrice(grandTotal)}</span>
              </div>

              <Button
                onClick={handleConfirmOrder}
                disabled={placingOrder || !selectedAddressId || !selectedMethod || isAddingAddress}
                className="w-full h-14 bg-white text-black hover:bg-white/90 transition-colors uppercase tracking-widest text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {placingOrder ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />{" "}
                    İŞLENİYOR...
                  </span>
                ) : (
                  "SİPARİŞİ ONAYLA"
                )}
              </Button>
              <p className="text-[10px] text-center text-white/40 leading-relaxed">
                Siparişi Onayla butonuna basarak Mesafeli Satış Sözleşmesi&apos;ni kabul etmiş olursunuz.
              </p>
            </aside>
          </div>
        </div>
      </div>

      {/* ── SELECT FROM MY COUPONS MODAL ── */}
      {showCouponsModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300"
          onClick={() => setShowCouponsModal(false)}
        >
          <div
            className="bg-zinc-950 border border-white/15 rounded-2xl max-w-md w-full p-6 space-y-4 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <Ticket className="w-4 h-4 text-emerald-400" /> Kuponlarımdan Seç
              </h3>
              <button
                onClick={() => setShowCouponsModal(false)}
                className="text-white/40 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-60 overflow-y-auto custom-scrollbar pr-1">
              {userCoupons.map((coupon) => (
                <div
                  key={coupon.id}
                  className="bg-black/60 border border-white/10 rounded-xl p-3 flex items-center justify-between hover:border-emerald-500/50 transition-colors"
                >
                  <div>
                    <span className="font-mono font-bold text-sm text-emerald-400 block">
                      {coupon.code}
                    </span>
                    <span className="text-[11px] text-white/60">
                      %{coupon.discountPercent} İndirim ({coupon.durationDays} Günlük)
                    </span>
                  </div>
                  <Button
                    type="button"
                    onClick={() => handleApplyCouponCode(coupon.code)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 h-8 uppercase tracking-wider"
                  >
                    Kullan
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── MARKETPLACE MODAL (Trendyol / Shopier) ── */}
      {showModal && selectedMethod && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-lg p-8 relative animate-in fade-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">{METHOD_STYLES[selectedMethod].icon}</span>
              <h3 className="text-xl font-bold text-white">
                {METHOD_STYLES[selectedMethod].label}
              </h3>
            </div>

            {selectedMethod === "trendyol" && (
              <div className="space-y-5">
                <p className="text-white/70 text-sm leading-relaxed">
                  {paymentSettings.trendyol?.description}
                </p>
                <div className="bg-black/50 border border-white/10 rounded-lg p-4">
                  <p className="text-xs text-white/50 mb-1">Ürün Kod(lar)ı:</p>
                  <div className="flex items-center gap-2">
                    <p className="text-white font-mono font-bold text-lg">{productCodes}</p>
                    <button
                      onClick={() => copyText(productCodes, "trendyol-code")}
                      className="text-white/40 hover:text-white"
                    >
                      {copiedField === "trendyol-code" ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                <Button
                  onClick={() => handleRedirect(paymentSettings.trendyol?.link || "")}
                  className="w-full h-12 text-white font-bold uppercase tracking-widest"
                  style={{ background: "#FF6000" }}
                >
                  <ExternalLink className="w-4 h-4 mr-2" /> Trendyol&apos;a Git
                </Button>
              </div>
            )}

            {selectedMethod === "shopier" && (
              <div className="space-y-5">
                <p className="text-white/70 text-sm leading-relaxed">
                  {paymentSettings.shopier?.description}
                </p>
                <div className="bg-black/50 border border-white/10 rounded-lg p-4">
                  <p className="text-xs text-white/50 mb-1">Ürün Kod(lar)ı:</p>
                  <div className="flex items-center gap-2">
                    <p className="text-white font-mono font-bold text-lg">{productCodes}</p>
                    <button
                      onClick={() => copyText(productCodes, "shopier-code")}
                      className="text-white/40 hover:text-white"
                    >
                      {copiedField === "shopier-code" ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                <Button
                  onClick={() => handleRedirect(paymentSettings.shopier?.link || "")}
                  className="w-full h-12 text-white font-bold uppercase tracking-widest"
                  style={{ background: "#00C853" }}
                >
                  <ExternalLink className="w-4 h-4 mr-2" /> Shopier&apos;e Git
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
