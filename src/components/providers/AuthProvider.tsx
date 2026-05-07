"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, getRedirectResult } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

interface UserProfile {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email: string | null;
  createdAt?: any /* eslint-disable-line @typescript-eslint/no-explicit-any */;
  [key: string]: any /* eslint-disable-line @typescript-eslint/no-explicit-any */;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // This will force fetching the profile document again.
  const refreshProfile = async (currentUser: User | null = user) => {
    if (!currentUser) {
      setProfile(null);
      return;
    }

    try {
      const docRef = doc(db, "users", currentUser.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfile;
        setProfile(data);
        
        // Sync favorites from Firebase to local store
        if (data.favorites && Array.isArray(data.favorites)) {
          const { useFavoritesStore } = await import("@/store/favoritesStore");
          useFavoritesStore.getState().setFavorites(data.favorites);
        }
      } else {
        // If it's a new login (e.g. Google auth) and no profile exists, create one
        const newProfile: UserProfile = {
          email: currentUser.email,
          firstName: currentUser.displayName?.split(" ")[0] || "",
          lastName: currentUser.displayName?.split(" ").slice(1).join(" ") || "",
          createdAt: serverTimestamp(),
        };
        await setDoc(docRef, newProfile);
        setProfile(newProfile);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  useEffect(() => {
    // Handle redirect result
    getRedirectResult(auth).catch((error) => {
      console.error("Redirect result error:", error);
    });

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await refreshProfile(currentUser);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
