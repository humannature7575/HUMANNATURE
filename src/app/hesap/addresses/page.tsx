"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { collection, query, getDocs, addDoc, deleteDoc, updateDoc, doc, serverTimestamp, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Plus, Trash2, Edit2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Address {
  id: string;
  title: string;
  fullName: string;
  phone: string;
  city: string;
  district: string;
  fullAddress: string;
  isDefault: boolean;
  createdAt?: any /* eslint-disable-line @typescript-eslint/no-explicit-any */;
}

export default function AddressesPage() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "", fullName: "", phone: "", city: "", district: "", fullAddress: "", isDefault: false
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchAddresses();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchAddresses = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const q = query(collection(db, "users", user.uid, "addresses"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const fetched: Address[] = [];
      snapshot.docs.forEach((d) => fetched.push({ id: d.id, ...d.data() } as Address));
      
      // Sort so default is first
      fetched.sort((a, b) => (a.isDefault === b.isDefault ? 0 : a.isDefault ? -1 : 1));
      setAddresses(fetched);
    } catch (error) {
      console.error("Error fetching addresses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (address?: Address) => {
    if (address) {
      setEditingId(address.id);
      setFormData({
        title: address.title,
        fullName: address.fullName,
        phone: address.phone,
        city: address.city,
        district: address.district,
        fullAddress: address.fullAddress,
        isDefault: address.isDefault
      });
    } else {
      setEditingId(null);
      setFormData({
        title: "", fullName: "", phone: "", city: "", district: "", fullAddress: "", isDefault: addresses.length === 0
      });
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);

    try {
      const addressData = {
        ...formData,
      };

      // If this is set as default, we need to remove default from others
      if (addressData.isDefault) {
        for (const addr of addresses) {
          if (addr.id !== editingId && addr.isDefault) {
             await updateDoc(doc(db, "users", user.uid, "addresses", addr.id), { isDefault: false });
          }
        }
      }

      if (editingId) {
        await updateDoc(doc(db, "users", user.uid, "addresses", editingId), addressData);
      } else {
        await addDoc(collection(db, "users", user.uid, "addresses"), {
          ...addressData,
          createdAt: serverTimestamp()
        });
      }
      
      await fetchAddresses();
      handleCloseForm();
    } catch (error) {
      console.error("Error saving address:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user || !confirm("Bu adresi silmek istediğinize emin misiniz?")) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "addresses", id));
      await fetchAddresses();
    } catch (error) {
      console.error("Error deleting address:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (isFormOpen) {
    return (
      <div className="bg-white/5 border border-white/10 p-6 rounded-lg text-white">
        <h2 className="text-xl font-medium tracking-widest uppercase mb-6 pb-4 border-b border-white/10">
          {editingId ? "ADRESİ DÜZENLE" : "YENİ ADRES EKLE"}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-white/60">Adres Başlığı (Ev, İş vb.)</label>
              <input 
                required 
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full bg-black border border-white/20 rounded-md px-4 py-3 focus:outline-none focus:border-white transition-colors" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-white/60">Ad Soyad</label>
              <input 
                required 
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                className="w-full bg-black border border-white/20 rounded-md px-4 py-3 focus:outline-none focus:border-white transition-colors" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-white/60">Telefon</label>
              <input 
                required 
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full bg-black border border-white/20 rounded-md px-4 py-3 focus:outline-none focus:border-white transition-colors" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-white/60">İl</label>
              <input 
                required 
                value={formData.city}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
                className="w-full bg-black border border-white/20 rounded-md px-4 py-3 focus:outline-none focus:border-white transition-colors" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-white/60">İlçe</label>
              <input 
                required 
                value={formData.district}
                onChange={(e) => setFormData({...formData, district: e.target.value})}
                className="w-full bg-black border border-white/20 rounded-md px-4 py-3 focus:outline-none focus:border-white transition-colors" 
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest text-white/60">Açık Adres</label>
            <textarea 
              required 
              rows={3}
              value={formData.fullAddress}
              onChange={(e) => setFormData({...formData, fullAddress: e.target.value})}
              className="w-full bg-black border border-white/20 rounded-md px-4 py-3 focus:outline-none focus:border-white transition-colors resize-none" 
            />
          </div>
          
          <div className="flex items-center gap-2 pt-2">
             <input 
               type="checkbox" 
               id="isDefault"
               checked={formData.isDefault}
               onChange={(e) => setFormData({...formData, isDefault: e.target.checked})}
               className="w-4 h-4 bg-black border-white/20 rounded accent-white"
             />
             <label htmlFor="isDefault" className="text-sm text-white/80">Varsayılan adres olarak ayarla</label>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-white/10 mt-6">
            <Button type="button" variant="ghost" onClick={handleCloseForm} className="text-white hover:bg-white/10 uppercase tracking-widest text-xs">
              İPTAL
            </Button>
            <Button type="submit" disabled={saving} className="bg-white text-black hover:bg-white/90 uppercase tracking-widest text-xs px-8">
              {saving ? "KAYDEDİLİYOR..." : "KAYDET"}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-medium tracking-widest text-white uppercase">
          ADRESLERİM
        </h2>
        <Button onClick={() => handleOpenForm()} className="bg-white text-black hover:bg-white/90 uppercase tracking-widest text-xs">
          <Plus className="w-4 h-4 mr-2" /> YENİ ADRES
        </Button>
      </div>

      {addresses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((address) => (
            <div key={address.id} className={`p-5 rounded-lg border flex flex-col relative transition-colors ${address.isDefault ? "bg-white/10 border-white/30" : "bg-white/5 border-white/10 hover:border-white/20"}`}>
               {address.isDefault && (
                 <span className="absolute top-4 right-4 text-[10px] uppercase tracking-widest bg-white text-black px-2 py-1 rounded-sm font-bold">
                   VARSAYILAN
                 </span>
               )}
               <div className="flex items-center gap-2 mb-3">
                 <MapPin className="w-4 h-4 text-white/60" />
                 <h3 className="text-lg font-medium text-white">{address.title}</h3>
               </div>
               <div className="space-y-1 text-sm text-white/70 mb-6 flex-1">
                 <p className="font-medium text-white">{address.fullName}</p>
                 <p>{address.fullAddress}</p>
                 <p>{address.district} / {address.city}</p>
                 <p className="pt-2">{address.phone}</p>
               </div>
               
               <div className="flex gap-2 pt-4 border-t border-white/10 mt-auto">
                 <button onClick={() => handleOpenForm(address)} className="flex-1 flex justify-center items-center gap-2 py-2 text-xs uppercase tracking-widest text-white hover:bg-white/10 rounded transition-colors">
                   <Edit2 className="w-3 h-3" /> DÜZENLE
                 </button>
                 <button onClick={() => handleDelete(address.id)} className="flex-1 flex justify-center items-center gap-2 py-2 text-xs uppercase tracking-widest text-red-400 hover:bg-red-500/10 rounded transition-colors">
                   <Trash2 className="w-3 h-3" /> SİL
                 </button>
               </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 p-12 flex flex-col items-center justify-center text-center rounded-lg h-[300px]">
          <MapPin className="w-12 h-12 text-white/20 mb-4" />
          <p className="text-white/60 font-light mb-6">Henüz kayıtlı bir adresiniz bulunmuyor.</p>
          <Button onClick={() => handleOpenForm()} variant="outline" className="text-black bg-white border-white hover:bg-white/90 uppercase tracking-widest text-xs h-12 px-8">
            İLK ADRESİNİ EKLE
          </Button>
        </div>
      )}
    </div>
  );
}
