/**
 * HUMAN NATURE — Cloud Functions (Gen 2)
 * 
 * onNewOrderCreated: Triggers on new order creation in 'orders' collection.
 * - Sends FCM Push Notification to 'admin' topic
 * - Sends Email notification to store owner via Resend (if configured)
 * 
 * All notification settings (API keys, emails, toggles) are stored in
 * Firestore: settings/notifications — fully managed from the Flutter Admin panel.
 */

import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { getFirestore } from "firebase-admin/firestore";
import { buildOrderEmailHtml } from "./emailTemplate";

// Initialize Firebase Admin SDK
initializeApp();

/**
 * Format a number as Turkish Lira currency string.
 */
function formatTRY(value: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
  }).format(value);
}

// ═══════════════════════════════════════════════════════════════
// 🚀 onNewOrderCreated — Main Cloud Function
// ═══════════════════════════════════════════════════════════════

export const onNewOrderCreated = onDocumentCreated(
  {
    document: "orders/{orderId}",
    region: "europe-west1",
    // Use the named database
    database: "humannature",
  },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      console.warn("No data associated with the event.");
      return;
    }

    const orderData = snapshot.data();
    const orderId = orderData.orderId || event.params.orderId;
    const customerName: string = orderData.customerName || "Müşteri";
    const customerPhone: string = orderData.customerPhone || "";
    const total: number = orderData.total || 0;
    const items: Array<{
      name: string;
      price: number;
      quantity: number;
      size?: string;
      color?: string;
      image?: string;
    }> = orderData.items || [];
    const address = orderData.address || {};

    const formattedTotal = formatTRY(total);
    const itemCount = items.reduce((sum, item) => sum + (item.quantity || 1), 0);

    console.log(`📦 New order received: ${orderId} — ${customerName} — ${formattedTotal}`);

    // ─────────────────────────────────────────────────────────
    // 1. FCM Push Notification → 'admin' topic
    // ─────────────────────────────────────────────────────────
    try {
      const message = {
        topic: "admin",
        notification: {
          title: "Yeni Sipariş Alındı! 🚀",
          body: `${customerName} — ${formattedTotal} (${itemCount} ürün)`,
        },
        data: {
          orderId: String(orderId),
          customerName: String(customerName),
          total: String(total),
          type: "new_order",
          click_action: "FLUTTER_NOTIFICATION_CLICK",
        },
        android: {
          priority: "high" as const,
          notification: {
            sound: "default",
            channelId: "new_orders",
            icon: "ic_notification",
          },
        },
        // Web push (for potential future web admin)
        webpush: {
          notification: {
            icon: "/icon-192x192.png",
            badge: "/badge-72x72.png",
          },
        },
      };

      const response = await getMessaging().send(message);
      console.log(`✅ FCM notification sent successfully: ${response}`);
    } catch (error) {
      console.error("❌ FCM notification error:", error);
      // Don't throw — we still want to try sending the email
    }

    // ─────────────────────────────────────────────────────────
    // 2. Email Notification via Resend (if configured)
    // ─────────────────────────────────────────────────────────
    try {
      // Read notification settings from Firestore
      const db = getFirestore("humannature");
      const settingsDoc = await db.collection("settings").doc("notifications").get();
      const settings = settingsDoc.exists ? settingsDoc.data() : null;

      const adminEmail = settings?.adminEmail;
      const emailEnabled = settings?.emailEnabled !== false; // default to true
      const apiKey = settings?.resendApiKey || "";

      if (!adminEmail) {
        console.log("ℹ️ No admin email configured — skipping email notification.");
        return;
      }

      if (!emailEnabled) {
        console.log("ℹ️ Email notifications disabled — skipping.");
        return;
      }

      if (!apiKey) {
        console.warn("⚠️ Resend API Key not configured in admin settings — skipping email notification.");
        return;
      }

      // Dynamic import of Resend to avoid issues when API key is not set
      const { Resend } = await import("resend");
      const resend = new Resend(apiKey);

      // Determine sender email from settings or use default
      const senderEmail = settings?.senderEmail || "onboarding@resend.dev";
      const senderName = settings?.senderName || "HUMAN NATURE";

      const emailHtml = buildOrderEmailHtml({
        orderId,
        customerName,
        customerPhone,
        formattedTotal,
        items,
        address,
      });

      // Support multiple emails separated by commas
      const emailList = adminEmail
        .split(",")
        .map((email: string) => email.trim())
        .filter((email: string) => email.length > 0);

      const { data, error } = await resend.emails.send({
        from: `${senderName} <${senderEmail}>`,
        to: emailList, // Array of emails
        subject: `🚀 Yeni Sipariş: ${orderId} — ${formattedTotal}`,
        html: emailHtml,
      });

      if (error) {
        console.error("❌ Resend email error:", error);
      } else {
        console.log(`✅ Email sent successfully: ${data?.id}`);
      }
    } catch (error) {
      console.error("❌ Email notification error:", error);
    }
  }
);
