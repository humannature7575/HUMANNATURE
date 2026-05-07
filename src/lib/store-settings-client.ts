import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface StoreSettings {
  brandName: string;
  legalName: string;
  mersisNo: string;
  taxOffice: string;
  taxNo: string;
  address: string;
  phone: string;
  email: string;
  workingHours: string;
  returnDays: string;
  returnCargoCompany: string;
  returnCargoCode: string;
  founderName: string;
  founderPhoto: string;
  aboutText: string;
}

const defaultStoreSettings: StoreSettings = {
  brandName: "HUMAN NATURE",
  legalName: "HUMAN NATURE TEKSTİL TİCARET A.Ş.",
  mersisNo: "0000000000000000",
  taxOffice: "İstanbul",
  taxNo: "0000000000",
  address: "İstanbul, Türkiye",
  phone: "+90 555 555 55 55",
  email: "info@humannature.com",
  workingHours: "Hafta içi 09:00 - 18:00",
  returnDays: "14",
  returnCargoCompany: "MNG Kargo",
  returnCargoCode: "000000000",
  founderName: "Kurucumuz",
  founderPhoto: "",
  aboutText: "Bu marka, tasarımları bizzat kurgulayan, kesimini yapan ve uzman ellerde bir araya getiren kurucumuz tarafından yönetilmektedir. 10 yılı aşkın tecrübe, siparişlerde esneklik, kusursuz ve profesyonel işçilik.",
};

/**
 * Fetch store settings using the Firebase Client SDK.
 * Safe to use in client components and browser-side code.
 */
export async function getStoreSettings(): Promise<StoreSettings> {
  try {
    const docRef = doc(db, "settings", "store");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { ...defaultStoreSettings, ...docSnap.data() as StoreSettings };
    }
  } catch (error) {
    console.error("Error fetching store settings (client):", error);
  }
  return defaultStoreSettings;
}
