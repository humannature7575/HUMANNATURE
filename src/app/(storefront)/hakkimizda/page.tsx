import Image from "next/image";
import { getStoreSettings } from "@/lib/store-settings-server";
import { Metadata } from "next";
import { ShieldCheck, Clock, Scissors } from "lucide-react";

export const metadata: Metadata = {
  title: "Hakkımızda | HUMAN NATURE",
  description: "Markamızın hikayesi, kurucumuz ve değerlerimiz.",
};

export const revalidate = 60; // Revalidate every minute

export default async function AboutUsPage() {
  const settings = await getStoreSettings();

  return (
    <div className="w-full min-h-screen bg-black pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <h1 className="text-3xl md:text-5xl font-light uppercase tracking-[0.2em] text-white mb-6">
            Hakkımızda
          </h1>
          <div className="w-24 h-[1px] bg-white/20 mx-auto" />
        </div>

        {/* Content Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24 items-center">
          
          {/* Image Side */}
          <div className="relative group animate-in fade-in slide-in-from-left-8 duration-1000 delay-150">
            <div className="absolute -inset-4 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-xl rounded-full" />
            <div className="relative aspect-[3/4] md:aspect-[4/5] w-full overflow-hidden rounded-2xl border border-white/10 bg-[#111]">
              {settings.founderPhoto ? (
                <Image
                  src={settings.founderPhoto}
                  alt={settings.founderName || "Kurucumuz"}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover object-top transition-transform duration-1000 group-hover:scale-105"
                  priority
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-white/20 space-y-4">
                  <Scissors className="w-16 h-16" strokeWidth={1} />
                  <span className="text-sm tracking-widest uppercase">Fotoğraf Yüklenmedi</span>
                </div>
              )}
            </div>
            
            {/* Name Badge */}
            <div className="absolute -bottom-6 -right-6 md:bottom-8 md:-right-12 bg-black/80 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-2xl">
              <p className="text-xs text-white/50 uppercase tracking-widest mb-1">Kurucu & Tasarımcı</p>
              <p className="text-xl text-white font-medium tracking-wider">{settings.founderName || "Kurucumuz"}</p>
            </div>
          </div>

          {/* Text Side */}
          <div className="flex flex-col justify-center space-y-10 animate-in fade-in slide-in-from-right-8 duration-1000 delay-300">
            
            <div className="space-y-6">
              <h2 className="text-2xl font-light text-white tracking-widest uppercase">Hikayemiz</h2>
              <div className="w-12 h-[2px] bg-white" />
              <p className="text-white/70 leading-relaxed text-lg font-light">
                {settings.aboutText}
              </p>
            </div>

            {/* Features/Values Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-8 border-t border-white/10">
              
              <div className="flex items-start space-x-4">
                <div className="p-3 rounded-full bg-white/5 border border-white/10 shrink-0">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-medium tracking-wider mb-1">10+ Yıl Tecrübe</h3>
                  <p className="text-sm text-white/50 leading-relaxed">Yılların getirdiği ustalık ve sektörel bilgi birikimi.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="p-3 rounded-full bg-white/5 border border-white/10 shrink-0">
                  <Scissors className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-medium tracking-wider mb-1">Özel Tasarım</h3>
                  <p className="text-sm text-white/50 leading-relaxed">Bizzat kurgulanan ve özenle kesilen benzersiz modeller.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="p-3 rounded-full bg-white/5 border border-white/10 shrink-0">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-medium tracking-wider mb-1">Kusursuz İşçilik</h3>
                  <p className="text-sm text-white/50 leading-relaxed">Uzman ellerde bir araya getirilen, detaylara önem veren üretim.</p>
                </div>
              </div>

            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
