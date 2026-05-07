import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

interface FavoritesState {
  items: string[];
  toggleFavorite: (productId: string) => Promise<void>;
  setFavorites: (productIds: string[]) => void;
  isFavorite: (productId: string) => boolean;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      items: [],
      setFavorites: (productIds) => set({ items: productIds }),
      isFavorite: (productId) => get().items.includes(productId),
      toggleFavorite: async (productId) => {
        const isFav = get().items.includes(productId);
        const newItems = isFav
          ? get().items.filter((id) => id !== productId)
          : [...get().items, productId];

        // Optimistic UI update
        set({ items: newItems });

        // Sync with Firestore if logged in
        const user = auth.currentUser;
        if (user) {
          try {
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
              favorites: isFav ? arrayRemove(productId) : arrayUnion(productId)
            });
          } catch (error) {
            console.error("Error syncing favorites to Firestore:", error);
            // Revert on failure (optional) could be done here
          }
        }
      },
    }),
    {
      name: 'favorites-storage', // local storage key
    }
  )
);
