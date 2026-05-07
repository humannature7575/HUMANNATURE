"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import { doc, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"

import { routes } from "@/lib/routes"
import { cn } from "@/lib/utils"
import { useCartStore } from "@/store/cartStore"
import { useAuth } from "@/components/providers/AuthProvider"
import { SocialIcons } from "@/components/ui/SocialIcons"

/* ── Static navigation links (non-category) ── */
const staticLinks = [
  { id: "tum-urunler", href: routes.allProducts, label: "Tüm Ürünler" },
  { id: "yeni-gelenler", href: routes.newArrivals, label: "Yeni Gelenler" },
  { id: "trend", href: routes.trending, label: "Trend" },
]

interface NavLink {
  id: string
  href: string
  label: string
}

/* ── Premium thin-stroke SVG icons ── */
function CartIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 01-8 0" />
    </svg>
  )
}

function AccountIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M20 21a8 8 0 10-16 0" />
    </svg>
  )
}

export function Navbar() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const menuOpenedAtRef = useRef(0)
  const [categoryLinks, setCategoryLinks] = useState<NavLink[]>([
    { id: "giyim", href: "/giyim", label: "Giyim" },
    { id: "aksesuar", href: "/aksesuar", label: "Aksesuar" },
  ])

  const items = useCartStore((state) => state.items)
  const totalItems = items.reduce((total, item) => total + item.quantity, 0)
  
  const { user } = useAuth()
  const accountUrl = user ? routes.account : routes.login

  // Stream categories from Firestore
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "settings", "categories"),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data()
          const list = (data?.list as Array<{ slug: string; title: string }>) ?? []
          if (list.length > 0) {
            setCategoryLinks(
              list.map((cat) => ({
                id: cat.slug,
                href: `/${cat.slug}`,
                label: cat.title,
              }))
            )
          }
        }
      },
      (error) => console.error("Error fetching categories for navbar:", error)
    )
    return () => unsub()
  }, [])

  // Build the combined nav links: static + dynamic categories
  const navLinks: NavLink[] = [
    { id: "home", href: "/ana-sayfa", label: "Ana Sayfa" },
    ...staticLinks,
    ...categoryLinks,
  ]

  const closeMenu = useCallback(() => {
    setMobileMenuOpen(false)
  }, [])

  const toggleMenu = useCallback(() => {
    setMobileMenuOpen((prev) => {
      if (prev) {
        return false
      }
      menuOpenedAtRef.current = Date.now()
      return true
    })
  }, [])

  const handleBackdropClick = useCallback(() => {
    if (Date.now() - menuOpenedAtRef.current < 500) {
      return
    }
    closeMenu()
  }, [closeMenu])

  const handleBrandLinkClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      if (Date.now() - menuOpenedAtRef.current < 550) {
        event.preventDefault()
        return
      }
      closeMenu()
    },
    [closeMenu]
  )

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }

    return () => {
      document.body.style.overflow = ""
    }
  }, [mobileMenuOpen])

  useEffect(() => {
    if (!mobileMenuOpen) {
      return
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu()
      }
    }

    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [closeMenu, mobileMenuOpen])

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-black/50 backdrop-blur-md border-b border-white/10 text-white">
        <div className="container flex h-16 md:h-[72px] max-w-screen-2xl items-center px-4 md:px-8 mx-auto">

          {/* ── Left: Mobile hamburger + Brand ── */}
          <div className="flex items-center gap-3 min-w-0 shrink-0">
            <button
              type="button"
              aria-label="Menüyü aç veya kapat"
              data-testid="mobile-menu-trigger"
              onClick={toggleMenu}
              className="md:hidden flex items-center justify-center w-10 h-10 -ml-1 rounded-md active:scale-95 transition-transform duration-150 touch-manipulation cursor-pointer"
            >
              <Menu className="w-6 h-6 pointer-events-none" />
            </button>

            <Link href={routes.home} className="flex items-center space-x-2.5 touch-manipulation">
              <Image
                src={routes.asset("/logo.svg")}
                alt="HUMAN NATURE"
                width={36}
                height={36}
                className="w-8 h-8 sm:w-9 sm:h-9 object-contain brightness-0 invert"
              />
              <span className="font-light tracking-[0.2em] uppercase text-xl hidden sm:inline-block">HUMAN NATURE</span>
              <span className="font-light tracking-[0.1em] uppercase text-[11px] sm:hidden">HUMAN NATURE</span>
            </Link>
            <SocialIcons className="flex sm:hidden ml-1" iconClassName="w-[14px] h-[14px] text-white/80" />
          </div>

          {/* ── Center: Desktop Navigation (absolutely centered) ── */}
          <nav className="hidden md:flex items-center justify-center flex-1">
            <div className="flex items-center gap-10">
              {navLinks.map((link) => {
                const isActive = pathname === link.href || pathname.startsWith(link.href + "/")
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "nav-link-premium text-[15px] tracking-[0.18em] uppercase font-light py-2 transition-colors duration-500",
                      isActive
                        ? "text-white nav-active"
                        : "text-white/60 hover:text-white"
                    )}
                  >
                    {link.label}
                  </Link>
                )
              })}
            </div>
          </nav>

          {/* ── Right: Account + Cart icons ── */}
          <div className="flex items-center gap-1 shrink-0 ml-auto md:ml-0">
            {/* Account icon */}
            <Link
              href={accountUrl}
              aria-label={user ? "Hesabım" : "Giriş Yap"}
              data-testid="header-account-link"
              className="relative flex items-center justify-center w-10 h-10 rounded-full text-white/70 hover:text-white transition-all duration-300 active:scale-95 touch-manipulation cursor-pointer"
            >
              <AccountIcon className="w-[22px] h-[22px]" />
            </Link>

            {/* Cart icon */}
            <Link
              href={routes.cart}
              aria-label="Sepet"
              data-testid="header-cart-link"
              className="relative flex items-center justify-center w-10 h-10 rounded-full text-white/70 hover:text-white transition-all duration-300 active:scale-95 touch-manipulation cursor-pointer"
            >
              <CartIcon className="w-[22px] h-[22px]" />
              {totalItems > 0 && (
                <span className="absolute top-1 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white text-black text-[9px] font-semibold">
                  {totalItems}
                </span>
              )}
            </Link>
          </div>

        </div>
      </header>

      {/* ═══════════ Mobile Menu ═══════════ */}
      {mobileMenuOpen && (
        <>
          <button
            type="button"
            aria-label="Menüden çık"
            onClick={handleBackdropClick}
            className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-xs"
          />

          <aside
            data-testid="mobile-menu-panel"
            className="fixed inset-y-0 left-0 z-[100] w-[85vw] max-w-sm bg-black border-r border-white/10 flex flex-col"
          >
            {/* Menu header */}
            <div className="flex items-center justify-between px-6 h-16 border-b border-white/10">
              <Link href={routes.home} onClick={handleBrandLinkClick} className="flex items-center space-x-2.5">
                <Image
                  src={routes.asset("/logo.svg")}
                  alt="HUMAN NATURE"
                  width={28}
                  height={28}
                  className="w-7 h-7 object-contain brightness-0 invert"
                />
                <span className="font-light tracking-[0.15em] uppercase text-sm">HUMAN NATURE</span>
              </Link>

              <button
                type="button"
                onClick={closeMenu}
                aria-label="Menüyü kapat"
                className="w-10 h-10 flex items-center justify-center rounded-md text-white/80 hover:text-white active:scale-95 transition-transform duration-150 touch-manipulation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile navigation links */}
            <nav className="flex flex-col overflow-y-auto" role="navigation">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  data-testid={`mobile-nav-${link.id}`}
                  onClick={closeMenu}
                  className={cn(
                    "flex items-center px-6 py-5 text-[15px] font-light tracking-[0.12em] uppercase transition-all duration-300 ease-out touch-manipulation cursor-pointer",
                    "border-b border-white/5 active:scale-95 active:text-[#D4AF37] active:bg-[#D4AF37]/5",
                    pathname === link.href || pathname.startsWith(link.href + "/")
                      ? "text-white bg-white/5 border-l-2 border-l-[#D4AF37]"
                      : "text-white/60"
                  )}
                >
                  {link.label}
                </Link>
              ))}

              {/* Account link in mobile menu */}
              <Link
                href={accountUrl}
                onClick={closeMenu}
                className={cn(
                  "flex items-center gap-3 px-6 py-5 text-[15px] font-light tracking-[0.12em] uppercase transition-all duration-300 ease-out touch-manipulation cursor-pointer",
                  "border-b border-white/5 active:scale-95 active:text-[#D4AF37] active:bg-[#D4AF37]/5",
                  (pathname === routes.account || pathname === routes.login)
                    ? "text-white bg-white/5 border-l-2 border-l-[#D4AF37]"
                    : "text-white/60"
                )}
              >
                <AccountIcon className="w-5 h-5" />
                {user ? "Hesabım" : "Giriş Yap"}
              </Link>
            </nav>

            {/* Menu footer */}
            <div className="px-6 py-6 border-t border-white/10 mt-auto bg-black/50">
              <div className="flex items-center gap-3 mb-3">
                <Image
                  src={routes.asset("/logo.svg")}
                  alt="HUMAN NATURE"
                  width={20}
                  height={20}
                  className="w-5 h-5 object-contain brightness-0 invert opacity-50"
                />
                <span className="font-light tracking-[0.15em] uppercase text-[10px] text-white/50">
                  Premium Menswear
                </span>
              </div>
              <p className="text-[10px] text-white/30">
                &copy; {new Date().getFullYear()} Human Nature. Tüm hakları saklıdır.
              </p>
            </div>
          </aside>
        </>
      )}
    </>
  )
}
