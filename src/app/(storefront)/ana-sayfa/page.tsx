import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { FeaturedCategories } from "@/components/home/FeaturedCategories";
import { TrendingProducts } from "@/components/home/TrendingProducts";
import { routes } from "@/lib/routes";

export default function StorefrontHome() {
  return (
    <div className="flex flex-col bg-black text-white w-full">
      {/* Hero Section */}
      <div className="relative flex flex-col items-center justify-center min-h-[100svh] md:min-h-screen overflow-hidden -mt-16 bg-black">
        <div className="absolute inset-0 z-0 bg-black">
          <Image 
            src={routes.asset("/hero-banner.jpg")}
            alt="HUMAN NATURE Premium Menswear"
            fill
            priority
            className="object-cover object-[75%_center] md:object-center opacity-95"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/30" />
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 w-full h-full pt-16">
          <div className="max-w-4xl space-y-6 md:space-y-8">
            <span className="block text-xs sm:text-sm md:text-base font-semibold tracking-[0.18em] sm:tracking-[0.24em] md:tracking-[0.3em] uppercase text-white/70">
              Zamana Meydan Okuyan Tasarımlar
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.1]">
              <span className="block">Tarzını</span>
              <span className="block text-white/90 font-light mt-2">Yeniden Tanımla</span>
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed font-light mt-6">
              Modern beyefendiler için tasarlanmış seçkin premium erkek giyim koleksiyonumuzu keşfedin. Eşsiz kalite, lüks kumaşlar ve kusursuz kesim.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 pt-8 sm:pt-10">
              <Button render={<Link href={routes.allProducts} />} nativeButton={false} size="lg" className="w-full sm:w-auto h-14 px-6 sm:px-10 bg-white text-black hover:bg-white/90 rounded-none font-medium tracking-wide uppercase text-sm">
                Koleksiyonu Keşfet
              </Button>
              
              <Button render={<Link href={routes.newArrivals} />} nativeButton={false} size="lg" variant="outline" className="w-full sm:w-auto h-14 px-6 sm:px-10 bg-black/20 backdrop-blur-md border border-white/20 text-white hover:bg-white/10 hover:text-white rounded-none font-medium tracking-wide uppercase text-sm">
                Yeni Gelenler
              </Button>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center animate-bounce opacity-70">
          <span className="text-[10px] tracking-widest uppercase text-white mb-2">
            Keşfet
          </span>
          <ChevronDown className="w-5 h-5 text-white" />
        </div>
      </div>

      <FeaturedCategories />
      <TrendingProducts />
    </div>
  );
}
