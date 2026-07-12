"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { useCartStore } from "@/store/cartStore";
import { collection, query, getDocs, addDoc, serverTimestamp, doc, getDoc, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { MapPin, Plus, ShoppingBag, CheckCircle, ShieldCheck, X, Copy, ExternalLink } from "lucide-react";
import Image from "next/image";
import { routes } from "@/lib/routes";
import { Button } from "@/components/ui/button";

function formatPrice(value: number): string {
  return value.toLocaleString("tr-TR", { style: "currency", currency: "TRY" });
}

interface PaymentSettings {
  trendyol?: { enabled: boolean; link: string; description: string };
  shopier?: { enabled: boolean; link: string; description: string };
  bank?: { enabled: boolean; bankName: string; accountHolder: string; iban: string; whatsappNumber: string; description: string; barcodeImage?: string };
  cod?: { enabled: boolean; extraFeePercent: number; description: string };
}

type PaymentMethod = "trendyol" | "shopier" | "bank" | "cod";
type CartItemWithProductCode = { productCode?: string };

const METHOD_STYLES: Record<PaymentMethod, { color: string; bg: string; border: string; label: string; icon: string }> = {
  trendyol: { color: "#FF6000", bg: "rgba(255,96,0,0.1)", border: "rgba(255,96,0,0.4)", label: "Trendyol", icon: "🛒" },
  shopier: { color: "#00C853", bg: "rgba(0,200,83,0.1)", border: "rgba(0,200,83,0.4)", label: "Shopier", icon: "🏪" },
  bank: { color: "#1565C0", bg: "rgba(21,101,192,0.1)", border: "rgba(21,101,192,0.4)", label: "Banka Havalesi / EFT", icon: "🏦" },
  cod: { color: "#FFC107", bg: "rgba(255,193,7,0.1)", border: "rgba(255,193,7,0.4)", label: "Kapıda Ödeme", icon: "🏠" },
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
  const [formData, setFormData] = useState({ title: "Ev", fullName: "", phone: "", city: "", district: "", fullAddress: "" });

  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({});
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isStoreReady, setIsStoreReady] = useState(false);

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
      setFormData(f => ({
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

  useEffect(() => { if (user) fetchAddresses(); }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch payment settings from Firestore
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, "settings", "paymentMethods"));
        if (snap.exists()) setPaymentSettings(snap.data() as PaymentSettings);
      } catch (e) { console.error("Error fetching payment settings:", e); }
    })();
  }, []);

  const fetchAddresses = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, "users", user.uid, "addresses"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const fetched: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any
      snapshot.docs.forEach((d) => fetched.push({ id: d.id, ...d.data() }));
      fetched.sort((a, b) => (a.isDefault === b.isDefault ? 0 : a.isDefault ? -1 : 1));
      setAddresses(fetched);
      if (fetched.length > 0) setSelectedAddressId(fetched[0].id);
      else setIsAddingAddress(true);
    } catch (error) { console.error("Error fetching addresses:", error); }
    finally { setLoading(false); }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const docRef = await addDoc(collection(db, "users", user.uid, "addresses"), { ...formData, isDefault: addresses.length === 0, createdAt: serverTimestamp() });
      await fetchAddresses();
      setIsAddingAddress(false);
      setSelectedAddressId(docRef.id);
    } catch (error) { console.error("Error saving address:", error); }
  };

  const enabledMethods = (Object.keys(METHOD_STYLES) as PaymentMethod[]).filter(
    (m) => paymentSettings[m]?.enabled
  );

  const codFee = paymentSettings.cod?.extraFeePercent ?? 7;
  const codExtra = selectedMethod === "cod" ? Math.round(total * codFee / 100) : 0;
  const grandTotal = total + codExtra;

  const handleConfirmOrder = () => {
    if (!selectedMethod || !selectedAddressId) return;
    setShowModal(true);
  };

  const createFirestoreOrder = async (method: string) => {
    if (!user) return null;
    const selectedAddress = addresses.find((a) => a.id === selectedAddressId);
    const enrichedItems = await Promise.all(items.map(async (item) => {
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
      return { id: item.id, name: item.name, price: item.price, quantity: item.quantity, size: item.size, color: item.color, image: item.image, productCode: code };
    }));

    const orderData = {
      userId: user.uid,
      customerName: selectedAddress?.fullName || `${profile?.firstName || ""} ${profile?.lastName || ""}`.trim() || "Müşteri",
      customerPhone: selectedAddress?.phone || "",
      items: enrichedItems,
      subtotal: total, extraFee: codExtra, total: grandTotal,
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
      const { orderId, enrichedItems } = orderResult;
      const wa = paymentSettings.bank?.whatsappNumber?.replace(/\D/g, "") || "";
      const selectedAddress = addresses.find((a) => a.id === selectedAddressId);
      const customerName = selectedAddress?.fullName || `${profile?.firstName || ""} ${profile?.lastName || ""}`.trim() || "Müşteri";
      const customerPhone = selectedAddress?.phone || "";
      const addressDetails = selectedAddress ? `${selectedAddress.fullAddress} - ${selectedAddress.district}/${selectedAddress.city}` : "";
      const orderDetails = enrichedItems.map(i => `${i.quantity}x ${i.name} (${i.productCode})`).join(", ");
      const msgText = `Merhaba, siparişim için dekontumu gönderiyorum.\n\nSipariş No: ${orderId}\nMüşteri: ${customerName}\nTelefon: ${customerPhone}\nAdres: ${addressDetails}\nÜrünler: ${orderDetails}\nToplam Tutar: ${formatPrice(grandTotal)}`;
      const msg = encodeURIComponent(msgText);
      setShowModal(false);
      router.push(`${routes.checkout}/success?method=bank&wa=${wa}&msg=${msg}`);
    } catch (e) { console.error(e); alert("Bir hata oluştu."); setPlacingOrder(false); }
  };

  const handleCodConfirm = async () => {
    setPlacingOrder(true);
    try {
      await createFirestoreOrder("cod");
      setShowModal(false);
      router.push(`${routes.checkout}/success?method=cod`);
    } catch (e) { console.error(e); alert("Bir hata oluştu."); setPlacingOrder(false); }
  };

  const copyText = async (text: string, field: string) => {
    if (!text) return;
    let success = false;
    // Modern Clipboard API (HTTPS / secure contexts)
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        success = true;
      } catch { /* fall through */ }
    }
    // Legacy fallback (HTTP / older browsers)
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
      } catch { /* ignore */ }
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
        <h1 className="text-2xl font-light text-white tracking-widest uppercase mb-4">GÜVENLİ ÖDEME</h1>
        <p className="text-white/60 mb-8 max-w-md">Siparişinize devam edebilmek için hesabınıza giriş yapmanız gerekmektedir.</p>
        <Button onClick={() => router.push(routes.login)} className="bg-white text-black hover:bg-white/90 uppercase tracking-widest px-10 h-14">GİRİŞ YAP VEYA KAYIT OL</Button>
      </div>
    );
  }

  if (loading) {
    return (<div className="flex justify-center items-center min-h-[60vh]"><div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" /></div>);
  }

  if (user && profile && !profile.phone) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-4">
        <ShieldCheck className="w-16 h-16 text-white/30 mb-6" />
        <h1 className="text-2xl font-light text-white tracking-widest uppercase mb-4 text-center">TELEFON NUMARASI GEREKLİ</h1>
        <p className="text-white/60 mb-8 max-w-md text-center">Siparişinize devam edebilmek için hesap bilgilerinize bir telefon numarası eklemeniz gerekmektedir. Lütfen hesap ayarlarından numaranızı kaydedin.</p>
        <Button onClick={() => router.push(routes.account)} className="bg-white text-black hover:bg-white/90 uppercase tracking-widest px-10 h-14">HESABIMA GİT</Button>
      </div>
    );
  }

  // ── Product codes for modal ──
  const productCodes = items.map(i => (i as any).productCode ? (i as any).productCode : "KOD YOK").filter(Boolean).join(", "); // eslint-disable-line @typescript-eslint/no-explicit-any

  return (
    <div className="w-full min-h-screen bg-black pt-10 pb-24">
      <div className="container max-w-screen-xl mx-auto px-4 md:px-8">
        <h1 className="text-2xl sm:text-3xl font-light uppercase tracking-widest text-white mb-2">SİPARİŞ TAMAMLA</h1>
        <p className="text-white/50 text-sm mb-10">Adres ve ödeme yönteminizi seçerek siparişinizi tamamlayın.</p>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_400px] gap-8">
          <div className="space-y-8">
            {/* ── ADDRESS SECTION ── */}
            <section className="bg-white/5 border border-white/10 p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10 text-white">
                <MapPin className="w-5 h-5 text-white/70" />
                <h2 className="text-lg uppercase tracking-widest font-medium">1. TESLİMAT ADRESİ</h2>
              </div>
              {isAddingAddress ? (
                <form onSubmit={handleSaveAddress} className="space-y-5 animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5"><label className="text-xs uppercase tracking-widest text-white/50">Adres Başlığı</label><input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-black border border-white/20 px-4 py-3 text-white text-sm focus:outline-none focus:border-white transition-colors" placeholder="Ev, İş vb." /></div>
                    <div className="space-y-1.5"><label className="text-xs uppercase tracking-widest text-white/50">Ad Soyad</label><input required value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full bg-black border border-white/20 px-4 py-3 text-white text-sm focus:outline-none focus:border-white transition-colors" /></div>
                    <div className="space-y-1.5"><label className="text-xs uppercase tracking-widest text-white/50">Telefon</label><input required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-black border border-white/20 px-4 py-3 text-white text-sm focus:outline-none focus:border-white transition-colors" /></div>
                    <div className="space-y-1.5"><label className="text-xs uppercase tracking-widest text-white/50">İl / İlçe</label><div className="flex gap-2"><input required value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} placeholder="İl" className="w-1/2 bg-black border border-white/20 px-4 py-3 text-white text-sm focus:outline-none focus:border-white transition-colors" /><input required value={formData.district} onChange={e => setFormData({...formData, district: e.target.value})} placeholder="İlçe" className="w-1/2 bg-black border border-white/20 px-4 py-3 text-white text-sm focus:outline-none focus:border-white transition-colors" /></div></div>
                  </div>
                  <div className="space-y-1.5"><label className="text-xs uppercase tracking-widest text-white/50">Açık Adres</label><textarea required rows={2} value={formData.fullAddress} onChange={e => setFormData({...formData, fullAddress: e.target.value})} className="w-full bg-black border border-white/20 px-4 py-3 text-white text-sm focus:outline-none focus:border-white transition-colors resize-none" /></div>
                  <div className="flex gap-3 pt-2">
                    {addresses.length > 0 && <Button type="button" variant="ghost" onClick={() => setIsAddingAddress(false)} className="text-white hover:bg-white/10 uppercase tracking-widest text-xs">İPTAL</Button>}
                    <Button type="submit" className="bg-white text-black hover:bg-white/90 uppercase tracking-widest text-xs px-8">KAYDET VE SEÇ</Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {addresses.map((address) => (
                      <div key={address.id} onClick={() => setSelectedAddressId(address.id)} className={`p-4 border rounded cursor-pointer transition-all ${selectedAddressId === address.id ? "border-white bg-white/10" : "border-white/20 bg-black hover:border-white/40"}`}>
                        <div className="flex justify-between items-center mb-2"><span className="font-medium text-white">{address.title}</span>{selectedAddressId === address.id && <CheckCircle className="w-4 h-4 text-white" />}</div>
                        <div className="text-xs text-white/70 space-y-1"><p>{address.fullName} - {address.phone}</p><p className="line-clamp-2">{address.fullAddress}</p><p>{address.district} / {address.city}</p></div>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" onClick={() => setIsAddingAddress(true)} className="w-full border-white/20 text-white hover:bg-white/10 uppercase tracking-widest mt-2 h-12"><Plus className="w-4 h-4 mr-2" /> YENİ ADRES EKLE</Button>
                </div>
              )}
            </section>

            {/* ── PAYMENT METHOD SELECTION ── */}
            <section className={`bg-white/5 border border-white/10 p-6 sm:p-8 transition-opacity duration-300 ${!selectedAddressId || isAddingAddress ? "opacity-50 pointer-events-none" : ""}`}>
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10 text-white">
                <ShieldCheck className="w-5 h-5 text-white/70" />
                <h2 className="text-lg uppercase tracking-widest font-medium">2. ÖDEME YÖNTEMİ</h2>
              </div>
              {enabledMethods.length === 0 ? (
                <p className="text-white/50 text-sm text-center py-8">Şu anda aktif ödeme yöntemi bulunmamaktadır.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {enabledMethods.map((method) => {
                    const s = METHOD_STYLES[method];
                    const isSelected = selectedMethod === method;
                    return (
                      <button key={method} onClick={() => setSelectedMethod(method)} className="text-left p-5 rounded-lg border-2 transition-all duration-300" style={{ borderColor: isSelected ? s.border : "rgba(255,255,255,0.1)", background: isSelected ? s.bg : "transparent" }}>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">{s.icon}</span>
                          <span className="text-white font-semibold text-sm">{s.label}</span>
                        </div>
                        <p className="text-white/50 text-xs leading-relaxed">{paymentSettings[method]?.description || ""}</p>
                        {method === "cod" && <p className="mt-2 text-xs font-medium" style={{ color: s.color }}>+%{codFee} ek ücret uygulanır</p>}
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {/* ── ORDER SUMMARY ── */}
          <div>
            <aside className="border border-white/10 bg-white/5 p-6 h-fit lg:sticky lg:top-24">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10 text-white">
                <ShoppingBag className="w-5 h-5 text-white/70" />
                <h2 className="text-lg uppercase tracking-widest font-medium">SİPARİŞ ÖZETİ</h2>
              </div>
              <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2">
                {items.map((item) => (
                  <div key={item.cartItemId} className="flex gap-4">
                    <div className="relative w-16 h-20 bg-white/10 shrink-0 rounded-sm overflow-hidden">{item.image && <Image src={item.image} alt={item.name} fill className="object-cover" sizes="64px" />}</div>
                    <div className="flex-1 flex flex-col justify-center">
                      <p className="text-sm text-white font-medium line-clamp-1">{item.name}</p>
                      <div className="text-[10px] text-white/50 uppercase tracking-widest mt-1 flex gap-2"><span>{item.size}</span> | <span>{item.color}</span> | <span>{item.quantity} ADET</span></div>
                      <p className="text-sm font-medium text-white mt-1">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-white/10 pt-4 space-y-3">
                <div className="flex items-center justify-between text-white/60 text-sm"><span>Ara Toplam</span><span>{formatPrice(total)}</span></div>
                <div className="flex items-center justify-between text-white/60 text-sm"><span>Kargo</span><span>Ücretsiz</span></div>
                {codExtra > 0 && <div className="flex items-center justify-between text-sm" style={{ color: "#FFC107" }}><span>Kapıda Ödeme Ücreti (%{codFee})</span><span>+{formatPrice(codExtra)}</span></div>}
              </div>
              <div className="border-t border-white/10 mt-4 pt-4 flex items-center justify-between text-white text-lg font-bold"><span>Ödenecek Tutar</span><span>{formatPrice(grandTotal)}</span></div>
              <Button onClick={handleConfirmOrder} disabled={placingOrder || !selectedAddressId || !selectedMethod || isAddingAddress} className="w-full mt-8 h-14 bg-white text-black hover:bg-white/90 transition-colors uppercase tracking-widest text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed">
                {placingOrder ? (<span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" /> İŞLENİYOR...</span>) : "SİPARİŞİ ONAYLA"}
              </Button>
              <p className="text-[10px] text-center text-white/40 mt-4 px-4 leading-relaxed">Siparişi Onayla butonuna basarak Mesafeli Satış Sözleşmesi&apos;ni ve Ön Bilgilendirme Formu&apos;nu okuduğunuzu ve kabul ettiğinizi onaylarsınız.</p>
            </aside>
          </div>
        </div>
      </div>

      {/* ── PAYMENT MODAL ── */}
      {showModal && selectedMethod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setShowModal(false)}>
          <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-lg p-8 relative animate-in fade-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
            
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">{METHOD_STYLES[selectedMethod].icon}</span>
              <h3 className="text-xl font-bold text-white">{METHOD_STYLES[selectedMethod].label}</h3>
            </div>

            {/* Trendyol Modal */}
            {selectedMethod === "trendyol" && (
              <div className="space-y-5">
                <p className="text-white/70 text-sm leading-relaxed">{paymentSettings.trendyol?.description}</p>
                <div className="bg-black/50 border border-white/10 rounded-lg p-4">
                  <p className="text-xs text-white/50 mb-1">Ürün Kod(lar)ı:</p>
                  <div className="flex items-center gap-2">
                    <p className="text-white font-mono font-bold text-lg">{productCodes}</p>
                    <button onClick={() => copyText(productCodes, 'trendyol-code')} className="text-white/40 hover:text-white">
                      {copiedField === 'trendyol-code' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button onClick={() => handleRedirect(paymentSettings.trendyol?.link || "")} className="w-full h-12 text-white font-bold uppercase tracking-widest" style={{ background: "#FF6000" }}>
                  <ExternalLink className="w-4 h-4 mr-2" /> Trendyol&apos;a Git
                </Button>
              </div>
            )}

            {/* Shopier Modal */}
            {selectedMethod === "shopier" && (
              <div className="space-y-5">
                <p className="text-white/70 text-sm leading-relaxed">{paymentSettings.shopier?.description}</p>
                <div className="bg-black/50 border border-white/10 rounded-lg p-4">
                  <p className="text-xs text-white/50 mb-1">Ürün Kod(lar)ı:</p>
                  <div className="flex items-center gap-2">
                    <p className="text-white font-mono font-bold text-lg">{productCodes}</p>
                    <button onClick={() => copyText(productCodes, 'shopier-code')} className="text-white/40 hover:text-white">
                      {copiedField === 'shopier-code' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button onClick={() => handleRedirect(paymentSettings.shopier?.link || "")} className="w-full h-12 text-white font-bold uppercase tracking-widest" style={{ background: "#00C853" }}>
                  <ExternalLink className="w-4 h-4 mr-2" /> Shopier&apos;e Git
                </Button>
              </div>
            )}

            {/* Bank Transfer Modal */}
            {selectedMethod === "bank" && (
              <div className="space-y-5">
                <p className="text-white/70 text-sm leading-relaxed">{paymentSettings.bank?.description}</p>
                <div className="bg-black/50 border border-white/10 rounded-lg p-4 space-y-3">
                  <div>
                    <p className="text-xs text-white/50">Banka</p>
                    <div className="flex items-center gap-2">
                      <p className="text-white font-medium">{paymentSettings.bank?.bankName}</p>
                      <button onClick={() => copyText(paymentSettings.bank?.bankName || "", 'bankName')} className="text-white/40 hover:text-white">{copiedField === 'bankName' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}</button>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-white/50">Hesap Sahibi</p>
                    <div className="flex items-center gap-2">
                      <p className="text-white font-medium">{paymentSettings.bank?.accountHolder}</p>
                      <button onClick={() => copyText(paymentSettings.bank?.accountHolder || "", 'accountHolder')} className="text-white/40 hover:text-white">{copiedField === 'accountHolder' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}</button>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-white/50">IBAN</p>
                    <div className="flex items-center gap-2">
                      <p className="text-white font-mono font-bold">{paymentSettings.bank?.iban}</p>
                      <button onClick={() => copyText(paymentSettings.bank?.iban || "", 'iban')} className="text-white/40 hover:text-white">{copiedField === 'iban' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}</button>
                    </div>
                  </div>
                  {paymentSettings.bank?.barcodeImage && (
                    <div className="pt-2">
                      <p className="text-xs text-white/50 mb-2">Barkod</p>
                      <div className="w-32 h-32 relative bg-white rounded flex items-center justify-center p-2 mx-auto">
                        <Image src={paymentSettings.bank.barcodeImage} alt="Barkod" fill className="object-contain p-2" />
                      </div>
                    </div>
                  )}
                  <div className="border-t border-white/10 pt-3"><p className="text-xs text-white/50">Ödenecek Tutar</p><p className="text-white font-bold text-xl">{formatPrice(grandTotal)}</p></div>
                </div>
                <Button onClick={handleBankConfirm} disabled={placingOrder} className="w-full h-12 text-white font-bold uppercase tracking-widest" style={{ background: "#1565C0" }}>
                  {placingOrder ? "İŞLENİYOR..." : "SİPARİŞİ OLUŞTUR"}
                </Button>
                <p className="text-xs text-white/40 text-center">Sipariş oluştuktan sonra dekontu WhatsApp üzerinden göndermeniz gerekmektedir.</p>
              </div>
            )}

            {/* Cash on Delivery Modal */}
            {selectedMethod === "cod" && (
              <div className="space-y-5">
                <p className="text-white/70 text-sm leading-relaxed">{paymentSettings.cod?.description}</p>
                <div className="bg-black/50 border border-white/10 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between text-sm"><span className="text-white/60">Ara Toplam</span><span className="text-white">{formatPrice(total)}</span></div>
                  <div className="flex justify-between text-sm" style={{ color: "#FFC107" }}><span>Kapıda Ödeme Ücreti (%{codFee})</span><span>+{formatPrice(codExtra)}</span></div>
                  <div className="border-t border-white/10 pt-3 flex justify-between"><span className="text-white font-bold">Toplam</span><span className="text-white font-bold text-xl">{formatPrice(grandTotal)}</span></div>
                </div>
                <Button onClick={handleCodConfirm} disabled={placingOrder} className="w-full h-12 text-black font-bold uppercase tracking-widest" style={{ background: "#FFC107" }}>
                  {placingOrder ? "İŞLENİYOR..." : "SİPARİŞİ ONAYLA"}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
