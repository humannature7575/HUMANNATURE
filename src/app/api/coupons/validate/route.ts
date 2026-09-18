import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!token) {
    return NextResponse.json({ error: "Lütfen giriş yapınız." }, { status: 401 });
  }

  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(token);
  } catch {
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 });
  }

  const body = await request.json();
  const rawCode = body?.code;

  if (!rawCode || typeof rawCode !== "string") {
    return NextResponse.json({ error: "Kupon kodu girilmedi." }, { status: 400 });
  }

  const code = rawCode.trim().toUpperCase();

  try {
    const couponDoc = await adminDb.collection("coupons").doc(code).get();

    if (!couponDoc.exists) {
      return NextResponse.json({ error: "Geçersiz kupon kodu." }, { status: 404 });
    }

    const data = couponDoc.data() || {};

    // Check ownership
    if (data.userId && data.userId !== decoded.uid) {
      return NextResponse.json(
        { error: "Bu kupon kodu yalnızca hak sahibi kullanıcı tarafından kullanılabilir." },
        { status: 403 }
      );
    }

    // Check if already used
    if (data.isUsed === true || data.status === "used") {
      return NextResponse.json({ error: "Bu kupon kodu daha önce kullanılmıştır." }, { status: 400 });
    }

    // Check expiration
    if (data.expiresAt) {
      const expiryDate = data.expiresAt.toDate ? data.expiresAt.toDate() : new Date(data.expiresAt);
      if (new Date() > expiryDate) {
        return NextResponse.json({ error: "Bu kupon kodunun kullanım süresi dolmuştur." }, { status: 400 });
      }
    }

    return NextResponse.json({
      valid: true,
      code: data.code || code,
      discountPercent: Number(data.discountPercent) || 10,
      minSpend: Number(data.minSpend) || 0,
    });
  } catch (error) {
    console.error("Coupon validation error:", error);
    return NextResponse.json({ error: "Kupon doğrulanırken bir hata oluştu." }, { status: 500 });
  }
}
