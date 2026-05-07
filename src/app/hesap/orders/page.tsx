"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { Package, ChevronRight, Clock, X, MessageCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { routes } from "@/lib/routes";
import { storeConfig } from "@/lib/storeConfig";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface OrderItem {
  id: string;
  title?: string;
  name?: string;
  imageUrl?: string;
  image?: string;
  price: number;
  quantity?: number;
}

interface Order {
  id: string;
  orderId?: string;
  createdAt: any /* eslint-disable-line @typescript-eslint/no-explicit-any */;
  totalAmount?: number;
  total?: number;
  status: string;
  statusColor?: string;
  items: OrderItem[];
}

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [paymentSettings, setPaymentSettings] = useState<any>({});

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

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedOrders = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Assign default status colors if not present
          statusColor: data.statusColor || (
            data.status === "Teslim Edildi" ? "text-green-500" :
            data.status === "Kargoya Verildi" ? "text-blue-500" :
            data.status === "Hazırlanıyor" ? "text-orange-500" :
            "text-white/50"
          )
        } as Order;
      });
      setOrders(fetchedOrders);
      setLoading(false);
    }, (error) => {
      console.error("Orders fetch error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const formatDate = (timestamp: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  };

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
        SİPARİŞLERİM
      </h2>
      
      {orders.length > 0 ? (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
              {/* Order Header */}
              <div className="bg-white/5 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 gap-4">
                 <div className="flex flex-wrap gap-x-8 gap-y-2">
                    <div>
                      <p className="text-[10px] text-white/50 uppercase tracking-widest mb-1">Sipariş Tarihi</p>
                      <p className="text-sm font-medium text-white">{formatDate(order.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/50 uppercase tracking-widest mb-1">Sipariş Özeti</p>
                      <p className="text-sm font-medium text-white">{order.items?.length || 0} Ürün</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/50 uppercase tracking-widest mb-1">Toplam Tutar</p>
                      <p className="text-sm font-bold text-white">{((order.totalAmount ?? order.total) || 0).toLocaleString("tr-TR")} {storeConfig.currency.symbol}</p>
                    </div>
                 </div>
                 <div className="flex flex-col sm:items-end">
                    <p className="text-[10px] text-white/50 uppercase tracking-widest mb-1">Sipariş No</p>
                    <p className="text-sm font-medium text-white">{order.orderId || order.id}</p>
                 </div>
              </div>

              {/* Order Body */}
              <div className="p-5">
                 <div className="flex items-center justify-between mb-4">
                   <div className="flex items-center gap-2">
                     <Clock className={`w-4 h-4 ${order.statusColor}`} />
                     <span className={`text-sm font-medium ${order.statusColor}`}>{order.status}</span>
                   </div>
                   <button onClick={() => setSelectedOrder(order)} className="text-xs text-white/70 hover:text-white flex items-center transition-colors">
                     SİPARİŞ DETAYI <ChevronRight className="w-3 h-3 ml-1" />
                   </button>
                 </div>

                 {/* Order Items */}
                 <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                   {order.items?.map((item, idx) => (
                     <div key={idx} className="shrink-0 flex gap-4 w-[280px] bg-black/40 p-3 rounded border border-white/5">
                        <div className="relative w-16 h-20 bg-white/5 shrink-0 rounded overflow-hidden">
                           <Image src={item.image || item.imageUrl || "/placeholder-image.jpg"} alt={item.name || item.title || "Ürün"} fill className="object-cover" />
                        </div>
                        <div className="flex flex-col justify-center">
                           <p className="text-sm font-medium text-white line-clamp-2">{item.name || item.title}</p>
                           <p className="text-xs text-white/60 mt-1">{((item.price || 0) * (item.quantity || 1)).toLocaleString("tr-TR")} {storeConfig.currency.symbol}</p>
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
             <Button variant="outline" className="text-black bg-white border-white hover:bg-white/90 uppercase tracking-widest text-xs h-12 px-8">
               ALIŞVERİŞE BAŞLA
             </Button>
          </Link>
        </div>
      )}

      {/* ── ORDER DETAILS MODAL ── */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4" onClick={() => setSelectedOrder(null)}>
          <div className="bg-zinc-900 border border-white/10 rounded-xl sm:rounded-2xl w-full max-w-lg p-5 sm:p-8 relative animate-in fade-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto custom-scrollbar" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedOrder(null)} className="absolute top-4 right-4 text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
            
            <h3 className="text-lg sm:text-xl font-bold text-white mb-5 sm:mb-6 uppercase tracking-widest border-b border-white/10 pb-3 sm:pb-4 pr-6">
              Sipariş Detayı
            </h3>
            
            <div className="space-y-5 sm:space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 bg-white/5 border border-white/10 p-3 sm:p-4 rounded-lg">
                 <div>
                    <p className="text-[10px] text-white/50 uppercase tracking-widest mb-1">Sipariş No</p>
                    <p className="text-xs sm:text-sm font-medium text-white break-all">{selectedOrder.orderId || selectedOrder.id}</p>
                 </div>
                 <div>
                    <p className="text-[10px] text-white/50 uppercase tracking-widest mb-1">Tarih</p>
                    <p className="text-xs sm:text-sm font-medium text-white">{formatDate(selectedOrder.createdAt)}</p>
                 </div>
                 <div>
                    <p className="text-[10px] text-white/50 uppercase tracking-widest mb-1">Durum</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Clock className={`w-3 h-3 ${selectedOrder.statusColor}`} />
                      <span className={`text-[11px] sm:text-sm font-medium ${selectedOrder.statusColor}`}>{selectedOrder.status}</span>
                    </div>
                 </div>
                 <div>
                    <p className="text-[10px] text-white/50 uppercase tracking-widest mb-1">Toplam</p>
                    <p className="text-xs sm:text-sm font-bold text-white">{((selectedOrder.totalAmount ?? selectedOrder.total) || 0).toLocaleString("tr-TR")} {storeConfig.currency.symbol}</p>
                 </div>
              </div>

              {/* Items */}
              <div>
                <p className="text-[10px] text-white/50 uppercase tracking-widest mb-2 sm:mb-3">Sipariş Edilen Ürünler</p>
                <div className="space-y-2 sm:space-y-3 max-h-[30vh] sm:max-h-40 overflow-y-auto custom-scrollbar pr-2">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="flex gap-3 sm:gap-4 items-center bg-black/20 p-2 rounded border border-white/5">
                      <div className="relative w-10 h-14 sm:w-12 sm:h-16 bg-white/5 shrink-0 rounded overflow-hidden">
                        <Image src={item.image || item.imageUrl || "/placeholder-image.jpg"} alt={item.name || item.title || "Ürün"} fill className="object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-white line-clamp-1">{item.name || item.title}</p>
                        <p className="text-[10px] sm:text-xs text-white/60">{((item.price || 0) * (item.quantity || 1)).toLocaleString("tr-TR")} {storeConfig.currency.symbol} {item.quantity && item.quantity > 1 ? `(${item.quantity} Adet)` : ""}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Receipt Sending Info */}
              <div className="bg-white/5 border border-white/10 p-3 sm:p-4 rounded-lg space-y-3 sm:space-y-4">
                 <p className="text-[11px] sm:text-xs text-white/80 leading-relaxed text-justify">
                   Eğer ödeme dekontunu göndermeyi unuttuysanız veya sipariş ekranında bir hata oluştuysa, dekontunuzu aşağıdaki WhatsApp butonuna tıklayarak gönderebilirsiniz. Ödeme dekontunuz doğrulandıktan sonra, dekontu gönderdiğiniz WhatsApp numarası üzerinden bilgilendirileceksiniz ve sipariş durumunuz hesabınızda güncellenecektir.
                 </p>
                 {paymentSettings?.bank?.whatsappNumber && (
                   <a
                     href={`https://wa.me/${paymentSettings.bank.whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent(`Merhaba, siparişim için dekontumu gönderiyorum.\n\nSipariş No: ${selectedOrder.orderId || selectedOrder.id}\nSipariş Tarihi: ${formatDate(selectedOrder.createdAt)}`)}`}
                     target="_blank"
                     rel="noopener noreferrer"
                     className="flex items-center justify-center h-10 sm:h-12 w-full rounded-md text-white font-bold uppercase tracking-widest transition-opacity hover:opacity-90 text-[10px] sm:text-xs px-2"
                     style={{ background: "#25D366" }}
                   >
                     <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 shrink-0" />
                     <span className="truncate">WhatsApp ile Dekont Gönder</span>
                   </a>
                 )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
