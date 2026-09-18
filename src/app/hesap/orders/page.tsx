"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import {
  Package,
  ChevronRight,
  Clock,
  X,
  MessageCircle,
  Building2,
  CreditCard,
  Copy,
  Check,
  ShieldCheck,
  AlertTriangle,
  QrCode,
  ArrowRight,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { routes } from "@/lib/routes";
import { storeConfig } from "@/lib/storeConfig";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useWhatsApp, formatWhatsAppNumber } from "@/hooks/useWhatsApp";

interface OrderItem {
  id: string;
  title?: string;
  name?: string;
  imageUrl?: string;
  image?: string;
  price: number;
  quantity?: number;
  productCode?: string;
}

interface Order {
  id: string;
  orderId?: string;
  createdAt: any /* eslint-disable-line @typescript-eslint/no-explicit-any */;
  totalAmount?: number;
  total?: number;
  status: string;
  statusColor?: string;
  paymentMethod?: string;
  customerName?: string;
  items: OrderItem[];
}

interface BankSettings {
  bankName?: string;
  accountHolder?: string;
  iban?: string;
  whatsappNumber?: string;
  description?: string;
  barcodeImage?: string;
}

export default function OrdersPage() {
  const { user } = useAuth();
  const { phoneNumber: globalWhatsAppNumber } = useWhatsApp();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [paymentSettings, setPaymentSettings] = useState<{ bank?: BankSettings }>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const snap = await getDoc(doc(db, "settings", "paymentMethods"));
        if (snap.exists()) setPaymentSettings(snap.data());
      } catch (e) {
        console.error("Error fetching payment settings", e);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "users", user.uid, "customer_orders"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedOrders = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            // Assign default status colors if not present
            statusColor:
              data.statusColor ||
              (data.status === "Teslim Edildi"
                ? "text-green-500"
                : data.status === "Kargoya Verildi"
                ? "text-blue-500"
                : data.status === "Hazırlanıyor"
                ? "text-orange-500"
                : data.status === "Ödeme Bekleniyor"
                ? "text-amber-400"
                : "text-white/50"),
          } as Order;
        });
        setOrders(fetchedOrders);
        setLoading(false);
      },
      (error) => {
        console.error("Orders fetch error:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

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

  const formatDate = (timestamp: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  const bank = paymentSettings.bank;

  return (
    <div>
      <h2 className="text-xl font-medium tracking-widest text-white uppercase mb-8">
        SİPARİŞLERİM
      </h2>

      {orders.length > 0 ? (
        <div className="space-y-6">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white/5 border border-white/10 rounded-lg overflow-hidden"
            >
              {/* Order Header */}
              <div className="bg-white/5 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 gap-4">
                <div className="flex flex-wrap gap-x-8 gap-y-2">
                  <div>
                    <p className="text-[10px] text-white/50 uppercase tracking-widest mb-1">
                      Sipariş Tarihi
                    </p>
                    <p className="text-sm font-medium text-white">{formatDate(order.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-white/50 uppercase tracking-widest mb-1">
                      Sipariş Özeti
                    </p>
                    <p className="text-sm font-medium text-white">
                      {order.items?.length || 0} Ürün
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-white/50 uppercase tracking-widest mb-1">
                      Toplam Tutar
                    </p>
                    <p className="text-sm font-bold text-white">
                      {((order.totalAmount ?? order.total) || 0).toLocaleString("tr-TR")}{" "}
                      {storeConfig.currency.symbol}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:items-end">
                  <p className="text-[10px] text-white/50 uppercase tracking-widest mb-1">
                    Sipariş No
                  </p>
                  <p className="text-sm font-medium text-white font-mono">
                    #{order.orderId || order.id}
                  </p>
                </div>
              </div>

              {/* Order Body */}
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className={`w-4 h-4 ${order.statusColor}`} />
                    <span className={`text-sm font-medium ${order.statusColor}`}>
                      {order.status}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="text-xs text-white/70 hover:text-white flex items-center transition-colors font-medium tracking-wider uppercase"
                  >
                    SİPARİŞ DETAYI <ChevronRight className="w-3 h-3 ml-1" />
                  </button>
                </div>

                {/* Order Items */}
                <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                  {order.items?.map((item, idx) => (
                    <div
                      key={idx}
                      className="shrink-0 flex gap-4 w-[280px] bg-black/40 p-3 rounded border border-white/5"
                    >
                      <div className="relative w-16 h-20 bg-white/5 shrink-0 rounded overflow-hidden">
                        <Image
                          src={item.image || item.imageUrl || "/placeholder-image.jpg"}
                          alt={item.name || item.title || "Ürün"}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex flex-col justify-center">
                        <p className="text-sm font-medium text-white line-clamp-2">
                          {item.name || item.title}
                        </p>
                        <p className="text-xs text-white/60 mt-1">
                          {((item.price || 0) * (item.quantity || 1)).toLocaleString("tr-TR")}{" "}
                          {storeConfig.currency.symbol}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 p-12 flex flex-col items-center justify-center text-center rounded-lg h-[400px]">
          <Package className="w-12 h-12 text-white/20 mb-4" />
          <p className="text-white/60 font-light mb-6">Henüz bir siparişiniz bulunmuyor.</p>
          <Link href={routes.allProducts}>
            <Button
              variant="outline"
              className="text-black bg-white border-white hover:bg-white/90 uppercase tracking-widest text-xs h-12 px-8"
            >
              ALIŞVERİŞE BAŞLA
            </Button>
          </Link>
        </div>
      )}

      {/* ── RICH ORDER DETAILS MODAL ── */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="bg-zinc-950 border border-white/15 rounded-2xl w-full max-w-2xl p-5 sm:p-8 relative animate-in fade-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto custom-scrollbar space-y-6 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-lg sm:text-xl font-bold uppercase tracking-widest text-white">
                Sipariş Detayı
              </h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 text-white/50 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Order Overview Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/5 border border-white/10 p-4 rounded-xl text-xs">
              <div>
                <p className="text-white/40 uppercase tracking-widest mb-1 text-[10px]">Sipariş No</p>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-white text-sm">
                    #{selectedOrder.orderId || selectedOrder.id}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(selectedOrder.orderId || selectedOrder.id, "modalOrderId")
                    }
                    className="p-0.5 text-white/50 hover:text-white"
                    title="Kopyala"
                  >
                    {copiedField === "modalOrderId" ? (
                      <Check className="w-3.5 h-3.5 text-green-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <p className="text-white/40 uppercase tracking-widest mb-1 text-[10px]">Tarih</p>
                <p className="font-medium text-white text-sm">{formatDate(selectedOrder.createdAt)}</p>
              </div>

              <div>
                <p className="text-white/40 uppercase tracking-widest mb-1 text-[10px]">Durum</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Clock className={`w-3.5 h-3.5 ${selectedOrder.statusColor}`} />
                  <span className={`font-semibold text-xs sm:text-sm ${selectedOrder.statusColor}`}>
                    {selectedOrder.status}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-white/40 uppercase tracking-widest mb-1 text-[10px]">Toplam Tutar</p>
                <p className="font-bold text-white text-sm">
                  {((selectedOrder.totalAmount ?? selectedOrder.total) || 0).toLocaleString("tr-TR")}{" "}
                  {storeConfig.currency.symbol}
                </p>
              </div>
            </div>

            {/* Items List */}
            <div>
              <p className="text-xs uppercase tracking-widest text-white/60 mb-3 font-semibold">
                Sipariş Edilen Ürünler
              </p>
              <div className="space-y-2.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                {selectedOrder.items?.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex gap-3 items-center bg-black/40 p-3 rounded-lg border border-white/5"
                  >
                    <div className="relative w-12 h-16 bg-white/5 shrink-0 rounded overflow-hidden">
                      <Image
                        src={item.image || item.imageUrl || "/placeholder-image.jpg"}
                        alt={item.name || item.title || "Ürün"}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white line-clamp-1">
                        {item.name || item.title}
                      </p>
                      <p className="text-xs text-white/50 mt-1">
                        {((item.price || 0) * (item.quantity || 1)).toLocaleString("tr-TR")}{" "}
                        {storeConfig.currency.symbol}{" "}
                        {item.quantity && item.quantity > 1 ? `(${item.quantity} Adet)` : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── BANK TRANSFER / PENDING PAYMENT FULL SECTION ── */}
            {(() => {
              const isBankOrPending =
                selectedOrder.paymentMethod === "bank" ||
                selectedOrder.status === "Ödeme Bekleniyor";

              if (!isBankOrPending) return null;

              const targetWhatsApp =
                formatWhatsAppNumber(bank?.whatsappNumber) || globalWhatsAppNumber || "";

              const orderIdStr = selectedOrder.orderId || selectedOrder.id;
              const formattedPriceStr = `${(
                (selectedOrder.totalAmount ?? selectedOrder.total) || 0
              ).toLocaleString("tr-TR")} TL`;

              const customerDisplayName = selectedOrder.customerName || "Değerli Müşterimiz";

              const waMessage = `Merhaba Human Nature Ekibi,

#${orderIdStr} numaralı siparişim için havale/EFT ödemesini gerçekleştirdim. Ödeme dekontumu ekte iletiyorum.

📋 *Sipariş Bilgileri:*
• *Sipariş No:* #${orderIdStr}
• *Müşteri:* ${customerDisplayName}
• *Toplam Tutar:* ${formattedPriceStr}

Siparişimin kontrol edilerek onaylanmasını rica ederim.`;

              const whatsappHref = targetWhatsApp
                ? `https://wa.me/${targetWhatsApp}?text=${encodeURIComponent(waMessage)}`
                : `https://wa.me/?text=${encodeURIComponent(waMessage)}`;

              return (
                <div className="space-y-5 pt-2 border-t border-white/10">
                  {/* 24-Hour Notice Warning Banner */}
                  <div className="bg-amber-500/15 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
                      <Clock className="w-5 h-5 animate-pulse" />
                    </div>
                    <div className="space-y-1 text-xs leading-relaxed">
                      <p className="text-amber-300 font-bold uppercase tracking-wider">
                        Önemli Bilgilendirme (24 Saat Süre)
                      </p>
                      <p className="text-white/80">
                        Siparişinizin onaylanıp kargoya verilebilmesi için lütfen{" "}
                        <strong className="text-white underline decoration-amber-400">
                          24 saat içerisinde
                        </strong>{" "}
                        banka havalesini yapıp dekontunuzu WhatsApp üzerinden bize iletiniz.
                      </p>
                      <p className="text-amber-200 font-medium flex items-center gap-1.5 pt-0.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        24 saat içinde dekontu iletilmeyen siparişler otomatik olarak iptal edilir.
                      </p>
                    </div>
                  </div>

                  {/* 3-Step Process Guide */}
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 sm:p-5 space-y-3">
                    <p className="text-xs font-bold uppercase tracking-widest text-white/90 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-green-400" />
                      Sipariş Tamamlama Adımları
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-black/50 border border-white/10 rounded-lg p-3 space-y-1.5 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[10px]">
                            1
                          </span>
                          <span className="font-bold text-white uppercase text-[11px]">
                            Havale Yapın
                          </span>
                        </div>
                        <p className="text-white/60 text-[11px] leading-relaxed">
                          Aşağıdaki IBAN&apos;a tutarı gönderin. Açıklamaya{" "}
                          <strong className="text-white">#{orderIdStr}</strong> yazın.
                        </p>
                      </div>

                      <div className="bg-black/50 border border-white/10 rounded-lg p-3 space-y-1.5 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center font-bold text-[10px]">
                            2
                          </span>
                          <span className="font-bold text-white uppercase text-[11px]">
                            WhatsApp&apos;a Tıklayın
                          </span>
                        </div>
                        <p className="text-white/60 text-[11px] leading-relaxed">
                          Aşağıdaki yeşil <strong className="text-green-400">&ldquo;WhatsApp ile Dekont Gönder&rdquo;</strong> butonuna basın.
                        </p>
                      </div>

                      <div className="bg-black/50 border border-white/10 rounded-lg p-3 space-y-1.5 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-[10px]">
                            3
                          </span>
                          <span className="font-bold text-white uppercase text-[11px]">
                            Dekontu Gönderin
                          </span>
                        </div>
                        <p className="text-white/60 text-[11px] leading-relaxed">
                          Açılan sohbete dekont fotoğrafı/PDF ekleyip gönderin. Ekibimiz anında onaylasın.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Bank Account Details */}
                  <div className="bg-black/60 border border-white/10 rounded-xl p-4 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-blue-400" />
                        <span className="text-xs font-bold uppercase tracking-widest text-white">
                          Banka Hesap Bilgileri
                        </span>
                      </div>
                      <span className="text-[10px] text-white/40">Havale / EFT / FAST</span>
                    </div>

                    <div className="space-y-2.5">
                      {/* Bank Name */}
                      {bank?.bankName && (
                        <div className="flex items-center justify-between bg-zinc-900/90 border border-white/10 rounded-lg p-3">
                          <div>
                            <p className="text-[10px] uppercase text-white/40 tracking-wider">
                              Banka Adı
                            </p>
                            <p className="text-xs sm:text-sm font-semibold text-white mt-0.5">
                              {bank.bankName}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(bank.bankName || "", "modalBankName")}
                            className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-[11px] font-medium text-white/80 hover:text-white flex items-center gap-1.5 transition-colors"
                          >
                            {copiedField === "modalBankName" ? (
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
                      {bank?.accountHolder && (
                        <div className="flex items-center justify-between bg-zinc-900/90 border border-white/10 rounded-lg p-3">
                          <div>
                            <p className="text-[10px] uppercase text-white/40 tracking-wider">
                              Hesap Sahibi (Alıcı)
                            </p>
                            <p className="text-xs sm:text-sm font-semibold text-white mt-0.5">
                              {bank.accountHolder}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              copyToClipboard(bank.accountHolder || "", "modalAccountHolder")
                            }
                            className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-[11px] font-medium text-white/80 hover:text-white flex items-center gap-1.5 transition-colors"
                          >
                            {copiedField === "modalAccountHolder" ? (
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
                      {bank?.iban && (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-zinc-900/90 border-2 border-blue-500/40 rounded-lg p-3.5 gap-2.5">
                          <div>
                            <p className="text-[10px] uppercase text-blue-400 font-bold flex items-center gap-1 tracking-wider">
                              <CreditCard className="w-3 h-3" /> IBAN NUMARASI
                            </p>
                            <p className="font-mono text-sm sm:text-base font-bold text-white mt-0.5 break-all">
                              {bank.iban}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(bank.iban || "", "modalIban")}
                            className="self-start sm:self-center px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shrink-0 transition-all shadow-md shadow-blue-600/20"
                          >
                            {copiedField === "modalIban" ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-white" />
                                <span>KOPYALANDI</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>IBAN KOPYALA</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}

                      {/* Description */}
                      <div className="flex items-center justify-between bg-zinc-900/90 border border-white/10 rounded-lg p-3">
                        <div>
                          <p className="text-[10px] uppercase text-amber-400 font-medium tracking-wider">
                            Transfer Açıklamasına Yazılacak:
                          </p>
                          <p className="text-xs sm:text-sm font-mono font-bold text-white mt-0.5">
                            #{orderIdStr}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(orderIdStr, "modalOrderDesc")}
                          className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-[11px] font-medium text-white/80 hover:text-white flex items-center gap-1.5 transition-colors"
                        >
                          {copiedField === "modalOrderDesc" ? (
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

                      {/* QR Barcode */}
                      {bank?.barcodeImage && (
                        <div className="pt-2 text-center bg-zinc-900/90 border border-white/10 rounded-lg p-3 space-y-2">
                          <p className="text-xs text-white/60 font-medium flex items-center justify-center gap-1.5">
                            <QrCode className="w-3.5 h-3.5 text-white/80" /> Hızlı Ödeme için Banka QR Kodu
                          </p>
                          <div className="w-32 h-32 relative bg-white rounded p-1.5 mx-auto flex items-center justify-center shadow">
                            <Image
                              src={bank.barcodeImage}
                              alt="Banka QR Kodu"
                              fill
                              className="object-contain p-1"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Big WhatsApp Action Button */}
                  <div className="pt-1">
                    <a
                      href={whatsappHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-center gap-2.5 w-full h-14 rounded-xl text-white font-bold text-sm sm:text-base uppercase tracking-wider transition-all duration-300 shadow-lg hover:opacity-95 active:scale-[0.99]"
                      style={{
                        background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
                        boxShadow: "0 8px 24px -4px rgba(37, 211, 102, 0.4)",
                      }}
                    >
                      <MessageCircle className="w-5 h-5 text-white" />
                      <span>WhatsApp ile Dekont Gönder</span>
                      <ArrowRight className="w-4 h-4 text-white/80 group-hover:translate-x-1 transition-transform" />
                    </a>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
