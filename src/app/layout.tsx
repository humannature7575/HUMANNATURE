import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "@/app/globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

import { Toaster } from "@/components/ui/sonner";
import { routes } from "@/lib/routes";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { MetaPixel } from "@/components/MetaPixel";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  interactiveWidget: "resizes-visual",
};

export const metadata: Metadata = {
  title: {
    default: "HUMAN NATURE | Premium Menswear",
    template: "%s | HUMAN NATURE",
  },
  description: "Premium erkek giyim mağazası. Yüksek kaliteli erkek kıyafetleri, şık tasarımlar ve konforlu kumaşlar.",
  icons: {
    icon: [
      { url: routes.asset("/logo.svg"), type: "image/svg+xml" },
      {
        url: routes.asset("/icon-192x192.png"),
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: routes.asset("/icon-512x512.png"),
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: routes.asset("/apple-touch-icon.png"),
  },
  manifest: routes.asset("/manifest.webmanifest"),
  openGraph: {
    title: "HUMAN NATURE | Premium Menswear",
    description: "Premium erkek giyim mağazası. Yüksek kaliteli erkek kıyafetleri.",
    siteName: "HUMAN NATURE",
    type: "website",
    locale: "tr_TR",
  },
  metadataBase: new URL("https://humannature.com"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" dir="ltr" className="dark" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${inter.className} min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-primary/20`}>
        <AuthProvider>
          <Navbar />
          <main className="flex-1 flex flex-col">
            {children}
          </main>
          <Footer />
          <InstallPrompt />
          <Toaster theme="dark" />
        </AuthProvider>
        <MetaPixel />
      </body>
    </html>
  );
}
