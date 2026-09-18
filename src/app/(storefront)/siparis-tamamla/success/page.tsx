"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  CheckCircle,
  Clock,
  MessageCircle,
  Home,
  Copy,
  Check,
  Building2,
  CreditCard,
  ShoppingBag,
  ShieldCheck,
  AlertTriangle,
  QrCode,
  ArrowRight,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { routes } from "@/lib/routes";
import { useWhatsApp, formatWhatsAppNumber } from "@/hooks/useWhatsApp";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface BankSettings {
  bankName?: string;
  accountHolder?: string;
  iban?: string;
  whatsappNumber?: string;
  description?: string;
  barcodeImage?: string;
}

interface StoredOrderDetails {
  orderId: string;
  total: string;
  method: string;
  customer: string;
  wa: string;
}

function SuccessContent() {
  const searchParams = useSearchParams();
  
  const [orderDetails, setOrderDetails] = useState<StoredOrderDetails>({
    orderId: "",
    total: "",
    method: "bank",
    customer: "Değerli Müşterimiz",
    wa: "",
  });

  const { phoneNumber: globalWhatsAppNumber } = useWhatsApp();
  const [bankSettings, setBankSettings] = useState<BankSettings | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Sync and persist order details in localStorage so it never disappears on refresh/switching apps
  useEffect(() => {
    const qMethod = searchParams.get("method");
    const qOrderId = searchParams.get("orderId");
    const qTotal = searchParams.get("total");
    const qCustomer = searchParams.get("customer");
    const qWa = searchParams.get("wa");

    if (qOrderId || qMethod) {
      const data: StoredOrderDetails = {
        orderId: qOrderId || "",
        total: qTotal || "",
        method: qMethod || "bank",
        customer: qCustomer || "Değerli Müşterimiz",
        wa: qWa || "",
      };
      setOrderDetails(data);
      try {
        localStorage.setItem("hn_last_order_success", JSON.stringify(data));
      } catch {
        /* ignore */
      }
    } else {
      try {
        const cached = localStorage.getItem("hn_last_order_success");
        if (cached) {
          setOrderDetails(JSON.parse(cached));
        }
      } catch {
        /* ignore */
      }
    }
  }, [searchParams]);

  // Fetch payment settings from Firestore for latest bank details
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, "settings", "paymentMethods"));
        if (snap.exists()) {
          const data = snap.data();
          if (data.bank) {
            setBankSettings(data.bank as BankSettings);
          }
        }
      } catch (e) {
        console.error("Error fetching bank settings:", e);
      }
    })();
  }, []);

  const orderId = orderDetails.orderId;
  const rawTotal = orderDetails.total;
  const customerName = orderDetails.customer;
  const isBank = orderDetails.method === "bank";
  const isCod = orderDetails.method === "cod";

  // Format currency
  const totalNumber = parseFloat(rawTotal);
  const formattedTotal = !isNaN(totalNumber) && totalNumber > 0
    ? totalNumber.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })
    : rawTotal ? `${rawTotal} ₺` : "";

  // Copy helper
  const copyToClipboard = async (text: string, fieldKey: string) => {
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
      setCopiedField(fieldKey);
      setTimeout(() => setCopiedField(null), 2500);
    }
  };

  // Determine WhatsApp recipient number
  const targetWhatsApp =
    formatWhatsAppNumber(bankSettings?.whatsappNumber) ||
    formatWhatsAppNumber(orderDetails.wa) ||
    globalWhatsAppNumber ||
    "";

  // Build structured WhatsApp message
  const whatsappMessage = `Merhaba Human Nature Ekibi,

${orderId ? `#${orderId}` : "Yeni"} numaralı siparişim için havale/EFT ödemesini gerçekleştirdim. Ödeme dekontumu ekte iletiyorum.

📋 *Sipariş Bilgileri:*
• *Sipariş No:* ${orderId || "Belirtilmedi"}
• *Müşteri:* ${customerName}
${formattedTotal ? `• *Toplam Tutar:* ${formattedTotal}\n` : ""}
Siparişim için ödeme dekontum ekte yer almaktadır. Siparişimin kontrol edilerek onaylanmasını rica ederim.`;

  const whatsappHref = targetWhatsApp
    ? `https://wa.me/${targetWhatsApp}?text=${encodeURIComponent(whatsappMessage)}`
    : `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div className="w-full min-h-screen bg-black text-white pt-8 pb-24 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* ── TOP HEADER / STATUS ── */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
              <div className="absolute -inset-1 rounded-full bg-green-500/20 animate-ping -z-10 opacity-75" style={{ animationDuration: "3s" }} />
            </div>
          </div>

          <div>
            <span className="inline-block px-3 py-1 rounded-full text-[11px] font-semibold tracking-widest uppercase bg-white/10 text-white/80 border border-white/15 mb-3">
              {isBank ? "Ödeme Bekleniyor (Havale / EFT)" : isCod ? "Sipariş Onaylandı" : "İşlem Tamamlandı"}
            </span>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-light uppercase tracking-widest text-white">
              {isBank ? "SİPARİŞİNİZ ALINDI" : isCod ? "SİPARİŞİNİZ ONAYLANDI" : "TEŞEKKÜRLER"}
            </h1>
            <p className="text-white/60 text-sm sm:text-base mt-2 max-w-lg mx-auto leading-relaxed">
              {isBank
                ? "Siparişiniz başarıyla sistemimize kaydedildi. Banka ödemenizi tamamlayıp dekontunuzu iletmeniz beklenmektedir."
                : isCod
                ? "Kapıda ödeme siparişiniz başarıyla alındı. Ürünleriniz kargoya verildiğinde size bildirim gönderilecektir."
                : "Siparişiniz başarıyla oluşturuldu."}
            </p>
          </div>

          {/* Order ID & Total Card */}
          {orderId && (
            <div className="inline-flex flex-wrap items-center justify-center gap-3 sm:gap-6 bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-white/50 text-xs uppercase tracking-wider">Sipariş No:</span>
                <span className="font-mono font-bold text-white text-base">#{orderId}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(orderId, "orderId")}
                  className="p-1 hover:bg-white/10 rounded text-white/60 hover:text-white transition-colors"
                  title="Sipariş Numarasını Kopyala"
                >
                  {copiedField === "orderId" ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>

              {formattedTotal && (
                <>
                  <div className="hidden sm:block w-px h-4 bg-white/20" />
                  <div className="flex items-center gap-2">
                    <span className="text-white/50 text-xs uppercase tracking-wider">Tutar:</span>
                    <span className="font-bold text-white text-base">{formattedTotal}</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* ── BANK TRANSFER SPECIFIC SECTION ── */}
        {isBank && (
          <div className="space-y-6 animate-in fade-in duration-500">
            
            {/* ⚠️ 24-HOUR CANCELLATION WARNING BANNER */}
            <div className="relative overflow-hidden bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent border border-amber-500/30 rounded-2xl p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
                  <Clock className="w-6 h-6 animate-pulse" />
                </div>
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-amber-300 font-semibold text-sm sm:text-base tracking-wide uppercase">
                      Önemli Bilgilendirme (24 Saat Süre)
                    </h2>
                  </div>
                  <p className="text-white/80 text-xs sm:text-sm leading-relaxed">
                    Siparişinizin hazırlanıp kargoya verilebilmesi için lütfen <strong className="text-white underline decoration-amber-400">24 saat içerisinde</strong> banka transferini gerçekleştirip ödeme dekontunuzu WhatsApp üzerinden bize iletiniz.
                  </p>
                  <p className="text-amber-200/90 text-xs font-medium pt-1 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    24 saat içinde dekontu iletilmeyen siparişler sistem tarafından otomatik olarak iptal edilir.
                  </p>
                </div>
              </div>
            </div>

            {/* ── 3-STEP VISUAL INSTRUCTION GUIDE ── */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-7 space-y-5">
              <h2 className="text-sm sm:text-base font-semibold uppercase tracking-widest text-white/90 flex items-center gap-2 border-b border-white/10 pb-4">
                <ShieldCheck className="w-5 h-5 text-green-400" />
                Siparişinizi Tamamlamak İçin 3 Kolay Adım
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Step 1 */}
                <div className="bg-black/50 border border-white/10 rounded-xl p-4 flex flex-col justify-between space-y-3 relative group hover:border-white/20 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs border border-blue-500/30">
                      1
                    </div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                      Banka Transferi Yapın
                    </h3>
                  </div>
                  <p className="text-xs text-white/60 leading-relaxed">
                    Aşağıdaki IBAN numarasına sipariş tutarını gönderin. Açıklama kısmına <strong className="text-white">#{orderId || "Sipariş No"}</strong> yazınız.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="bg-black/50 border border-white/10 rounded-xl p-4 flex flex-col justify-between space-y-3 relative group hover:border-white/20 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center font-bold text-xs border border-green-500/30">
                      2
                    </div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                      WhatsApp Butonuna Basın
                    </h3>
                  </div>
                  <p className="text-xs text-white/60 leading-relaxed">
                    Ödemeyi yaptıktan sonra bu sayfadaki yeşil <strong className="text-green-400">&ldquo;WhatsApp ile Dekont Gönder&rdquo;</strong> butonuna tıklayın.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="bg-black/50 border border-white/10 rounded-xl p-4 flex flex-col justify-between space-y-3 relative group hover:border-white/20 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs border border-purple-500/30">
                      3
                    </div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                      Dekontu Gönderin
                    </h3>
                  </div>
                  <p className="text-xs text-white/60 leading-relaxed">
                    WhatsApp sohbeti hazır mesajla açılacaktır. Dekont dosyanızı/fotoğrafınızı ekleyip gönderin, ekibimiz anında onaylasın.
                  </p>
                </div>
              </div>
            </div>

            {/* ── BANK ACCOUNT DETAILS CARD ── */}
            <div className="bg-zinc-900/90 border border-white/10 rounded-2xl p-5 sm:p-7 space-y-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <Building2 className="w-5 h-5 text-blue-400" />
                  <h2 className="text-sm sm:text-base font-bold uppercase tracking-widest text-white">
                    Banka Hesap Bilgileri
                  </h2>
                </div>
                <span className="text-[11px] text-white/40 tracking-wider">
                  Havale / EFT / FAST
                </span>
              </div>

              <div className="space-y-3.5">
                {/* Bank Name */}
                {bankSettings?.bankName && (
                  <div className="flex items-center justify-between bg-black/40 border border-white/10 rounded-xl p-3.5">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-white/40 font-medium">Banka Adı</p>
                      <p className="text-sm font-semibold text-white mt-0.5">{bankSettings.bankName}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(bankSettings.bankName || "", "bankName")}
                      className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-medium text-white/80 hover:text-white flex items-center gap-1.5 transition-colors"
                    >
                      {copiedField === "bankName" ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-green-400" />
                          <span className="text-green-400">Kopyalandı</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Kopyala</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Account Holder */}
                {bankSettings?.accountHolder && (
                  <div className="flex items-center justify-between bg-black/40 border border-white/10 rounded-xl p-3.5">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-white/40 font-medium">Hesap Sahibi (Alıcı)</p>
                      <p className="text-sm font-semibold text-white mt-0.5">{bankSettings.accountHolder}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(bankSettings.accountHolder || "", "accountHolder")}
                      className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-medium text-white/80 hover:text-white flex items-center gap-1.5 transition-colors"
                    >
                      {copiedField === "accountHolder" ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-green-400" />
                          <span className="text-green-400">Kopyalandı</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Kopyala</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* IBAN */}
                {bankSettings?.iban && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-black/60 border-2 border-blue-500/30 rounded-xl p-4 gap-3">
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase tracking-widest text-blue-400 font-bold flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5" />
                        IBAN NUMARASI
                      </p>
                      <p className="font-mono text-base sm:text-lg font-bold text-white tracking-wider break-all">
                        {bankSettings.iban}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(bankSettings.iban || "", "iban")}
                      className="self-start sm:self-center px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold tracking-wider uppercase flex items-center gap-2 transition-all shrink-0 shadow-lg shadow-blue-600/20"
                    >
                      {copiedField === "iban" ? (
                        <>
                          <Check className="w-4 h-4 text-white" />
                          <span>KOPYALANDI!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>IBAN KOPYALA</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Transfer Description */}
                {orderId && (
                  <div className="flex items-center justify-between bg-black/40 border border-white/10 rounded-xl p-3.5">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-amber-400/90 font-medium">Banka Açıklama Kısmına Yazılacak:</p>
                      <p className="text-sm font-mono font-bold text-white mt-0.5">#{orderId}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(orderId, "orderIdDesc")}
                      className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-medium text-white/80 hover:text-white flex items-center gap-1.5 transition-colors"
                    >
                      {copiedField === "orderIdDesc" ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-green-400" />
                          <span className="text-green-400">Kopyalandı</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Kopyala</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Barcode/QR if uploaded */}
                {bankSettings?.barcodeImage && (
                  <div className="pt-2 text-center bg-black/40 border border-white/10 rounded-xl p-4 space-y-2">
                    <p className="text-xs text-white/60 font-medium flex items-center justify-center gap-1.5">
                      <QrCode className="w-4 h-4 text-white/80" />
                      Hızlı Ödeme için Banka QR / Barkod Kodu
                    </p>
                    <div className="w-40 h-40 relative bg-white rounded-lg p-2 mx-auto flex items-center justify-center shadow-md">
                      <Image
                        src={bankSettings.barcodeImage}
                        alt="Banka QR Kodu"
                        fill
                        className="object-contain p-2"
                      />
                    </div>
                    <p className="text-[10px] text-white/40">Banka uygulamanızdan karekodu okutarak hızlı transfer yapabilirsiniz.</p>
                  </div>
                )}
              </div>
            </div>

            {/* ── BIG PROMINENT WHATSAPP BUTTON ── */}
            <div className="pt-2">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex items-center justify-center gap-3 w-full h-16 rounded-2xl text-white font-bold text-base sm:text-lg uppercase tracking-wider transition-all duration-300 shadow-xl hover:scale-[1.01] active:scale-[0.99]"
                style={{
                  background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
                  boxShadow: "0 10px 30px -5px rgba(37, 211, 102, 0.4)",
                }}
              >
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <span>WhatsApp ile Dekont Gönder</span>
                <ArrowRight className="w-5 h-5 text-white/80 group-hover:translate-x-1 transition-transform" />
              </a>
              <p className="text-center text-xs text-white/50 mt-2.5">
                Butona bastığınızda WhatsApp açılacak ve sipariş detaylarınız otomatik olarak mesaja eklenecektir.
              </p>
            </div>
          </div>
        )}

        {/* ── CASH ON DELIVERY SPECIFIC SECTION ── */}
        {isCod && (
          <div className="bg-zinc-900/80 border border-amber-500/30 rounded-2xl p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white uppercase tracking-wider">
              Kapıda Ödeme Bilgilendirmesi
            </h2>
            <p className="text-sm text-white/70 max-w-md mx-auto leading-relaxed">
              Siparişiniz kargo firmasına teslim edildiğinde takip numarası SMS ile paylaşılacaktır. Ödemenizi kargo teslimatı sırasında nakit veya kredi kartı ile yapabilirsiniz.
            </p>
          </div>
        )}

        {/* ── ACTION LINKS / FOOTER ── */}
        <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href={`${routes.account}/orders`}
            className={buttonVariants({
              variant: "outline",
              className:
                "w-full sm:w-auto h-13 border-white/20 text-white hover:bg-white/10 uppercase tracking-widest text-xs px-8 font-semibold",
            })}
          >
            <ShoppingBag className="w-4 h-4 mr-2" /> SİPARİŞLERİMİ GÖRÜNTÜLE
          </Link>

          <Link
            href="/"
            className={buttonVariants({
              variant: "ghost",
              className:
                "w-full sm:w-auto h-13 text-white/60 hover:text-white uppercase tracking-widest text-xs px-8",
            })}
          >
            <Home className="w-4 h-4 mr-2" /> ALIŞVERİŞE DEVAM ET
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full min-h-screen bg-black flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
