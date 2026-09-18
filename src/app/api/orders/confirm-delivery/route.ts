import { NextRequest, NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

function generateCouponCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed ambiguous chars like 0, O, 1, I
  let result = "";
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `HN-GIFT-${result}`;
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(token);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { orderId, orderDocId } = body || {};

  if (!orderId && !orderDocId) {
    return NextResponse.json({ error: "Order identifier required" }, { status: 400 });
  }

  try {
    // 1. Locate the customer order document
    const userOrdersRef = adminDb.collection("users").doc(decoded.uid).collection("customer_orders");
    let orderDocSnapshot;

    if (orderDocId) {
      orderDocSnapshot = await userOrdersRef.doc(orderDocId).get();
    } else {
      const q = await userOrdersRef.where("orderId", "==", orderId).limit(1).get();
      if (!q.empty) {
        orderDocSnapshot = q.docs[0];
      }
    }

    if (!orderDocSnapshot || !orderDocSnapshot.exists) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const orderData = orderDocSnapshot.data() || {};
    const docId = orderDocSnapshot.id;
    const resolvedOrderId = orderData.orderId || orderId || docId;

    // 2. Update order status to "Teslim Edildi"
    const updatePayload = {
      status: "Teslim Edildi",
      statusColor: "text-green-500",
      deliveredAt: FieldValue.serverTimestamp(),
      deliveredConfirmedByUser: true,
    };

    await userOrdersRef.doc(docId).set(updatePayload, { merge: true });

    // Also update main orders collection if accessible
    try {
      const mainOrderQuery = await adminDb.collection("orders").where("orderId", "==", resolvedOrderId).limit(1).get();
      if (!mainOrderQuery.empty) {
        await mainOrderQuery.docs[0].ref.set(updatePayload, { merge: true });
      } else {
        const directMainDoc = await adminDb.collection("orders").doc(docId).get();
        if (directMainDoc.exists) {
          await directMainDoc.ref.set(updatePayload, { merge: true });
        }
      }
    } catch (e) {
      console.error("Error updating main order:", e);
    }

    // 3. Check if a reward coupon was already generated for this order
    const existingCouponQuery = await adminDb
      .collection("users")
      .doc(decoded.uid)
      .collection("coupons")
      .where("sourceOrderId", "==", resolvedOrderId)
      .limit(1)
      .get();

    if (!existingCouponQuery.empty) {
      const existingData = existingCouponQuery.docs[0].data();
      return NextResponse.json({
        success: true,
        alreadyGenerated: true,
        coupon: existingData,
      });
    }

    // 4. Determine coupon parameters based on customer's choice or defaults
    const rewardChoice = orderData.selectedRewardCoupon || {};
    const discountPercent = Number(rewardChoice.percent) || (orderData.total >= 1200 ? 10 : 10);
    const durationDays = Number(rewardChoice.durationDays) || (discountPercent === 5 ? 60 : 30);

    // 5. Generate unique code
    let uniqueCode = generateCouponCode();
    let collisionCheck = await adminDb.collection("coupons").doc(uniqueCode).get();
    let attempts = 0;
    while (collisionCheck.exists && attempts < 5) {
      uniqueCode = generateCouponCode();
      collisionCheck = await adminDb.collection("coupons").doc(uniqueCode).get();
      attempts++;
    }

    const now = new Date();
    const expiryDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
    const expiresAtTimestamp = Timestamp.fromDate(expiryDate);

    const couponDoc = {
      id: uniqueCode,
      code: uniqueCode,
      userId: decoded.uid,
      customerName: orderData.customerName || "Değerli Müşterimiz",
      discountPercent,
      discountType: "percentage",
      durationDays,
      sourceOrderId: resolvedOrderId,
      createdAt: FieldValue.serverTimestamp(),
      expiresAt: expiresAtTimestamp,
      isUsed: false,
      usedAt: null,
      usedInOrderId: null,
      minSpend: 0,
      status: "active",
    };

    // Save in user coupons and global coupons for fast verification
    await Promise.all([
      adminDb.collection("users").doc(decoded.uid).collection("coupons").doc(uniqueCode).set(couponDoc),
      adminDb.collection("coupons").doc(uniqueCode).set(couponDoc),
    ]);

    return NextResponse.json({
      success: true,
      coupon: {
        code: uniqueCode,
        discountPercent,
        durationDays,
        expiresAt: expiryDate.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error confirming delivery:", error);
    return NextResponse.json({ error: "Failed to confirm delivery" }, { status: 500 });
  }
}
