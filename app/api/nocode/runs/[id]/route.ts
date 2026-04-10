import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConnect";
import { getAuthUser } from "@/lib/authUser";
import NocodeRun from "@/lib/models/NocodeRun";

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const auth = await getAuthUser();
    if (!auth?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;
    const run = await NocodeRun.findOne({ _id: id, userId: auth.userId });
    if (!run) return NextResponse.json({ error: "Run not found" }, { status: 404 });

    return NextResponse.json({ success: true, data: run });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch run" }, { status: 500 });
  }
}