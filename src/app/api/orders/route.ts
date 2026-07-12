import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

const ORDER_CODE_PREFIX = "HN-7575";
const ORDER_COUNTER_ID = "order_code_hn_7575";

function formatOrderCode(sequence: number): string {
  const suffix = sequence < 100 ? String(sequence).padStart(2, "0") : String(sequence);
  return `${ORDER_CODE_PREFIX}-${suffix}`;
}

function orderCodeSequence(value: unknown): number {
  if (typeof value !== "string") return 0;
  const match = value.trim().toUpperCase().match(/^HN-7575-(\d+)$/);
  const sequence = match ? Number(match[1]) : 0;
  return Number.isFinite(sequence) && sequence > 0 ? sequence : 0;
}

function highestSequenceFromDocs(
  docs: FirebaseFirestore.QueryDocumentSnapshot[],
  fields: string[],
): number {
  return docs.reduce((highest, doc) => {
    const data = doc.data();
    const values = [doc.id, ...fields.map((field) => data[field])];
    const docHighest = Math.max(...values.map(orderCodeSequence));
    return Math.max(highest, docHighest);
  }, 0);
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
  const orderInput = body?.orderData;
  if (!orderInput || !Array.isArray(orderInput.items) || orderInput.items.length === 0) {
    return NextResponse.json({ error: "Invalid order data" }, { status: 400 });
  }

  const result = await adminDb.runTransaction(async (transaction) => {
    const ordersRef = adminDb.collection("orders");
    const labelsRef = adminDb.collection("shipping_labels");
    const counterRef = adminDb.collection("system_counters").doc(ORDER_COUNTER_ID);

    const [ordersSnap, labelsSnap, counterSnap] = await Promise.all([
      transaction.get(ordersRef),
      transaction.get(labelsRef),
      transaction.get(counterRef),
    ]);

    const highestExisting = Math.max(
      highestSequenceFromDocs(ordersSnap.docs, ["orderId"]),
      highestSequenceFromDocs(labelsSnap.docs, ["orderId"]),
    );
    const counterValue = counterSnap.exists ? Number(counterSnap.data()?.value ?? 0) : 0;
    const nextValue = Math.max(highestExisting, counterValue) + 1;
    const orderId = formatOrderCode(nextValue);
    const orderRef = ordersRef.doc();

    const orderData = {
      ...orderInput,
      orderId,
      userId: decoded.uid,
      isRead: false,
      createdAt: FieldValue.serverTimestamp(),
    };

    transaction.set(counterRef, {
      value: nextValue,
      updatedAt: FieldValue.serverTimestamp(),
    });
    transaction.set(orderRef, orderData);
    transaction.set(
      adminDb.collection("users").doc(decoded.uid).collection("customer_orders").doc(orderRef.id),
      orderData,
    );

    return { orderId };
  });

  return NextResponse.json(result);
}
