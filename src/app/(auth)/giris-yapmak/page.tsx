"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, signInWithRedirect, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { routes } from "@/lib/routes";
import { useAuth } from "@/components/providers/AuthProvider";
import { useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar"; // eslint-disable-line @typescript-eslint/no-unused-vars
import { Footer } from "@/components/layout/Footer"; // eslint-disable-line @typescript-eslint/no-unused-vars

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      router.push(routes.account);
    }
  }, [user, router]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      if (!userCredential.user.emailVerified) {
        await auth.signOut();
        setError("Hesabınıza giriş yapabilmek için lütfen e-posta adresinize gönderilen doğrulama bağlantısına tıklayın.");
        setLoading(false);
        return;
      }

      router.push(routes.account);
    } catch (err: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) { // eslint-disable-line @typescript-eslint/no-unused-vars
      setError("Giriş başarısız. Lütfen bilgilerinizi kontrol edin.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    const provider = new GoogleAuthProvider();
    try {
      // Use popup for better UX and stability on production
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      if (err.code === "auth/popup-blocked") {
        // Fallback to redirect if popup is blocked
        await signInWithRedirect(auth, provider);
      } else if (err.code === "auth/popup-closed-by-user") {
        // User closed the popup, no error needed
        return;
      } else {
        console.error(err);
        setError(`Google ile giriş başarısız: ${err.message}`);
      }
    }
  };

  return (
    <div className="w-full min-h-screen bg-black flex flex-col pt-24 pb-20">
      <div className="container max-w-screen-xl mx-auto px-4 flex-1 flex items-center justify-center">
        <div className="w-full max-w-md bg-white/5 border border-white/10 p-6 sm:p-12 box-border">
          <h1 className="text-2xl sm:text-3xl font-light uppercase tracking-widest text-white text-center mb-8">
            GİRİŞ YAP
          </h1>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 mb-6 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-5">
            <div>
              <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">
                E-POSTA ADRESİ
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-transparent border border-white/20 text-white px-4 py-3 focus:outline-none focus:border-white transition-colors"
                placeholder="ornek@email.com"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">
                ŞİFRE
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-transparent border border-white/20 text-white px-4 py-3 focus:outline-none focus:border-white transition-colors"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black font-medium py-4 uppercase tracking-widest text-sm hover:bg-white/90 transition-colors disabled:opacity-50"
            >
              {loading ? "GİRİŞ YAPILIYOR..." : "GİRİŞ YAP"}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-widest">
              <span className="bg-[#0D0D0D] px-4 text-white/50">VEYA</span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            type="button"
            className="w-full bg-transparent border border-white text-white font-medium py-3 uppercase tracking-widest text-sm hover:bg-white/10 transition-colors flex items-center justify-center gap-3"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google İLE GİRİŞ YAP
          </button>

          <div className="mt-8 text-center text-sm text-white/50">
            Hesabınız yok mu?{" "}
            <Link href={routes.register} className="text-white hover:underline transition-all">
              KAYIT OL
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
