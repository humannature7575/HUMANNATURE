import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface SocialMediaLinks {
  instagram?: string;
  facebook?: string;
  tiktok?: string;
}

export function useSocialMedia() {
  const [links, setLinks] = useState<SocialMediaLinks | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "socialMedia"), (docSnap) => {
      if (docSnap.exists()) {
        setLinks(docSnap.data() as SocialMediaLinks);
      } else {
        setLinks(null);
      }
    });

    return () => unsub();
  }, []);

  return links;
}
