"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { routes } from "@/lib/routes";
import { SocialIcons } from "@/components/ui/SocialIcons";

const sidebarLinks = [
  { href: routes.account, label: "HESAP BİLGİLERİ" },
  { href: `${routes.account}/orders`, label: "SİPARİŞLERİM" },
  { href: `${routes.account}/favorites`, label: "FAVORİLERİM" },
  { href: `${routes.account}/addresses`, label: "ADRESLERİM" },
];

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.push(routes.login);
    }
  }, [user, loading, router]);

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/");
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-black flex items-center justify-center pt-20">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect shortly
  }

  return (
    <div className="w-full min-h-[calc(100vh-theme(spacing.16))] bg-black pt-20 pb-20">
      <div className="container max-w-screen-xl mx-auto px-4">
        
        {/* Header Greeting */}
        <div className="mb-12 border-b border-white/10 pb-6">
          <h1 className="text-2xl sm:text-3xl font-light uppercase tracking-widest text-white">
            HOŞ GELDİNİZ, <span className="font-medium">{profile?.firstName || user.displayName || "MİSAFİR"}</span>
          </h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Sidebar Navigation */}
          <aside className="w-full lg:w-64 shrink-0">
            <nav className="flex flex-col gap-2">
              {sidebarLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-4 py-3 text-xs uppercase tracking-widest transition-colors ${
                      isActive
                        ? "bg-white text-black font-medium"
                        : "text-white/60 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
              
              <button
                onClick={handleSignOut}
                className="mt-8 px-4 py-3 text-xs uppercase tracking-widest text-left text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
              >
                ÇIKIŞ YAP
              </button>
              
              {/* Social Icons inside Account Menu */}
              <div className="mt-8 px-4 pt-6 border-t border-white/10">
                <p className="text-[10px] uppercase tracking-widest text-white/40 mb-3">Bizi Takip Edin</p>
                <SocialIcons iconClassName="w-4 h-4 text-white/60 hover:text-white" className="gap-4" />
              </div>
            </nav>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 w-full max-w-3xl">
            {children}
          </main>

        </div>
      </div>
    </div>
  );
}
