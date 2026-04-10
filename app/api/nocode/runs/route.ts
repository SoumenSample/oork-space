import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConnect";
import { getAuthUser } from "@/lib/authUser";
import NocodeRun from "@/lib/models/NocodeRun";

export async function GET(req: Request) {
  try {
    await connectDB();
    const auth = await getAuthUser();
    if (!auth?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const appId = url.searchParams.get("appId");

    const query: Record<string, unknown> = { userId: auth.userId };
    if (appId) query.appId = appId;

    const runs = await NocodeRun.find(query).sort({ createdAt: -1 }).limit(100);
    return NextResponse.json({ success: true, data: runs });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to list runs" }, { status: 500 });
  }
}