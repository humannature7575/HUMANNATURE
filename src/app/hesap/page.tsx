"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { doc, updateDoc } from "firebase/firestore";
import { updateProfile as updateFirebaseProfile } from "firebase/auth";
import { db, auth } from "@/lib/firebase"; // eslint-disable-line @typescript-eslint/no-unused-vars
import { toast } from "sonner";

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  // Load existing data
  useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName || "");
      setLastName(profile.lastName || "");
      setPhone(profile.phone || "");
    }
  }, [profile]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    try {
      // 1. Update Firebase Auth Profile (DisplayName)
      await updateFirebaseProfile(user, {
        displayName: `${firstName} ${lastName}`.trim(),
      });

      // 2. Update Firestore User Document
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        firstName,
        lastName,
        phone,
      });

      // 3. Refresh Context Profile
      await refreshProfile();
      
      toast.success("Profil bilgileriniz başarıyla güncellendi.");
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error("Profil güncellenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 p-6 sm:p-10">
      <h2 className="text-lg font-light tracking-widest uppercase text-white mb-8">
        HESAP BİLGİLERİ
      </h2>

      <form onSubmit={handleUpdate} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">
              AD
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="w-full bg-transparent border border-white/20 text-white px-4 py-3 focus:outline-none focus:border-white transition-colors text-sm"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">
              SOYAD
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className="w-full bg-transparent border border-white/20 text-white px-4 py-3 focus:outline-none focus:border-white transition-colors text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">
            E-POSTA ADRESİ (Değiştirilemez)
          </label>
          <input
            type="email"
            value={user?.email || ""}
            disabled
            className="w-full bg-black/50 border border-white/10 text-white/50 px-4 py-3 cursor-not-allowed text-sm"
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">
            TELEFON NUMARASI
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            placeholder="+90 (___) ___ __ __"
            className="w-full bg-transparent border border-white/20 text-white px-4 py-3 focus:outline-none focus:border-white transition-colors text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-white text-black font-medium px-8 py-3 uppercase tracking-widest text-[11px] hover:bg-white/90 transition-colors disabled:opacity-50 mt-4"
        >
          {loading ? "KAYDEDİLİYOR..." : "DEĞİŞİKLİKLERİ KAYDET"}
        </button>
      </form>
    </div>
  );
}
