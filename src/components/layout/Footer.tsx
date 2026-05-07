import Link from 'next/link';
import Image from 'next/image';
import { routes } from "@/lib/routes";
import { SocialIcons } from "@/components/ui/SocialIcons";

export function Footer() {
  return (
    <footer className="w-full bg-black text-white border-t border-white/10 mt-auto py-12">
      <div className="container px-4 md:px-8 mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        
        <div className="flex flex-col items-center md:items-start space-y-3">
          <div className="flex items-center space-x-3">
            <Image 
              src={routes.asset("/logo.svg")} 
              alt="HUMAN NATURE" 
              width={40} 
              height={40} 
              className="w-10 h-10 object-contain brightness-0 invert"
            />
            <span className="font-light tracking-[0.08em] sm:tracking-[0.2em] uppercase text-base sm:text-lg">
              HUMAN NATURE
            </span>
          </div>
          <p className="text-xs text-white/50">
            &copy; {new Date().getFullYear()} Human Nature. All rights reserved.
          </p>
        </div>

        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-light text-white/70 text-center">
          <Link href="/hakkimizda" className="hover:text-white transition-colors">
            Hakkımızda
          </Link>
          <Link href={routes.legal.distanceSales} className="hover:text-white transition-colors">
            Mesafeli Satış Sözleşmesi
          </Link>
          <Link href={routes.legal.returnsExchange} className="hover:text-white transition-colors">
            İade ve Değişim
          </Link>
          <Link href={routes.legal.privacy} className="hover:text-white transition-colors">
            Gizlilik Politikası
          </Link>
          <Link href={routes.legal.terms} className="hover:text-white transition-colors">
            Kullanım Koşulları
          </Link>
          <Link href={routes.legal.contact} className="hover:text-white transition-colors">
            İletişim
          </Link>
        </nav>

        {/* Social Icons (Desktop/Tablet) */}
        <div className="hidden md:flex justify-center md:justify-end mt-4 md:mt-0">
          <SocialIcons />
        </div>


      </div>

    </footer>
  );
}
