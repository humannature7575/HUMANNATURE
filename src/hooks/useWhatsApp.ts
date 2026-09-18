"use client";

import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * Format Turkish / International numbers into standard WhatsApp wa.me format (e.g., 905XXXXXXXXX)
 */
export function formatWhatsAppNumber(raw?: string | null): string {
  if (!raw) return "";

  // If a full link like https://wa.me/90532... was entered
  if (raw.includes("wa.me/")) {
    const extracted = raw.split("wa.me/")[1]?.split("?")[0]?.replace(/\D/g, "");
    if (extracted) return extracted;
  }

  // Strip non-digit characters
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";

  // 12 digits starting with 90 (e.g. 905321234567)
  if (digits.startsWith("90") && digits.length === 12) {
    return digits;
  }

  // 11 digits starting with 05 (e.g. 05321234567) -> replace leading 0 with 90
  if (digits.startsWith("05") && digits.length === 11) {
    return "90" + digits.substring(1);
  }

  // 10 digits starting with 5 (e.g. 5321234567) -> prepend 90
  if (digits.startsWith("5") && digits.length === 10) {
    return "90" + digits;
  }

  // Fallback if 10 digits without leading 0 or 90
  if (digits.length === 10) {
    return "90" + digits;
  }

  return digits;
}

export function useWhatsApp() {
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [rawPhone, setRawPhone] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const defaultMessage = "Merhaba, Human Nature ürünleri hakkında bilgi almak istiyorum.";

  useEffect(() => {
    // 1. Listen to settings/store (primary source)
    const unsubStore = onSnapshot(
      doc(db, "settings", "store"),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const candidate = data.whatsappNumber || data.whatsapp || data.phone;
          if (candidate && candidate.trim() !== "") {
            setRawPhone(candidate);
            setPhoneNumber(formatWhatsAppNumber(candidate));
            setIsLoading(false);
            return;
          }
        }

        // 2. Fallback check on settings/socialMedia
        const unsubSocial = onSnapshot(
          doc(db, "settings", "socialMedia"),
          (socialSnap) => {
            if (socialSnap.exists()) {
              const socialData = socialSnap.data();
              const socialWa = socialData.whatsapp || socialData.whatsappNumber;
              if (socialWa && socialWa.trim() !== "") {
                setRawPhone(socialWa);
                setPhoneNumber(formatWhatsAppNumber(socialWa));
                setIsLoading(false);
                return;
              }
            }

            // 3. Fallback check on settings/paymentMethods (bank.whatsappNumber)
            const unsubPayment = onSnapshot(
              doc(db, "settings", "paymentMethods"),
              (paySnap) => {
                if (paySnap.exists()) {
                  const payData = paySnap.data();
                  const bankWa = payData?.bank?.whatsappNumber;
                  if (bankWa && bankWa.trim() !== "") {
                    setRawPhone(bankWa);
                    setPhoneNumber(formatWhatsAppNumber(bankWa));
                    setIsLoading(false);
                    return;
                  }
                }
                setIsLoading(false);
              },
              () => setIsLoading(false)
            );

            return () => unsubPayment();
          },
          (err) => {
            console.error("Error listening to socialMedia settings:", err);
            setIsLoading(false);
          }
        );

        return () => unsubSocial();
      },
      (err) => {
        console.error("Error listening to store settings:", err);
        setIsLoading(false);
      }
    );

    return () => {
      unsubStore();
    };
  }, []);

  const whatsappUrl = phoneNumber
    ? `https://wa.me/${phoneNumber}?text=${encodeURIComponent(defaultMessage)}`
    : null;

  return {
    phoneNumber,
    rawPhone,
    defaultMessage,
    whatsappUrl,
    isLoading,
  };
}
