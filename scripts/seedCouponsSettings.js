/* eslint-disable @typescript-eslint/no-require-imports */
require("dotenv").config({ path: ".env.local" });
require("dotenv").config({ path: ".env" });

const admin = require("firebase-admin");

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "humannature-291de";
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;
const databaseId = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID || "humannature";

if (!admin.apps.length) {
  if (clientEmail && privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, "\n"),
      }),
      projectId,
    });
  } else {
    admin.initializeApp({ projectId });
  }
}

const db = admin.firestore();

async function initCoupons() {
  console.log(`Initializing settings/coupons in database: ${databaseId}...`);
  try {
    const couponsRef = db.collection("settings").doc("coupons");
    await couponsRef.set(
      {
        enabled: true,
        minOrderAmount: 1200,
        optionAPercent: 10,
        optionADays: 30,
        optionBPercent: 5,
        optionBDays: 60,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    console.log("✅ Successfully initialized settings/coupons in Firestore!");
  } catch (error) {
    console.error("❌ Error initializing settings/coupons:", error);
  }
}

initCoupons();
