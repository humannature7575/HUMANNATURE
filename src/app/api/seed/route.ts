import { NextResponse } from "next/server";
import { seedDatabase } from "@/lib/seedData";

export async function GET() {
  try {
    const result = await seedDatabase();
    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 500 });
    }
  } catch (error: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
