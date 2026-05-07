"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { CheckCircle, MessageCircle, Home } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { routes } from "@/lib/routes";

function SuccessContent() {
  const searchParams = useSearchParams();
  const method = searchParams.get("method");
  const wa = searchParams.get("wa") || "";
  const msg = searchParams.get("msg") || "";

  const isBank = method === "bank";
  const isCod = method === "cod";

  return (
    <div className="w-full min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-lg w-full text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-2xl sm:text-3xl font-light uppercase tracking-widest text-white">
            {isBank ? "SİPARİŞİNİZ ALINDI" : isCod ? "SİPARİŞİNİZ ONAYLANDI" : "TEŞEKKÜRLER"}
          </h1>
          <p className="text-white/60 text-sm leading-relaxed max-w-md mx-auto">
            {isBank
              ? "Siparişiniz başarıyla oluşturuldu. Lütfen dekontunuzu WhatsApp üzerinden gönderdikten sonra onay mesajı alacaksınız."
              : isCod
              ? "Kapıda ödeme siparişiniz onaylandı. Teslimat sırasında ödemenizi yapabilirsiniz."
              : "İşleminiz başarıyla tamamlandı."}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {isBank && wa && (
            <a
              href={`https://wa.me/${wa}?text=${encodeURIComponent(msg)}`}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ className: "h-14 text-white font-bold uppercase tracking-widest" })}
              style={{ background: "#25D366" }}
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              WhatsApp ile Dekont Gönder
            </a>
          )}

          <Link
            href={`${routes.account}/orders`}
            className={buttonVariants({ variant: "outline", className: "h-12 border-white/20 text-white hover:bg-white/10 uppercase tracking-widest" })}
          >
            SİPARİŞLERİM
          </Link>

          <Link
            href="/"
            className={buttonVariants({ variant: "ghost", className: "h-12 text-white/60 hover:text-white uppercase tracking-widest" })}
          >
            <Home className="w-4 h-4 mr-2" /> ANA SAYFA
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div className="w-full min-h-screen bg-black flex items-center justify-center"><div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" /></div>}>
      <SuccessContent />
    </Suspense>
  );
}
