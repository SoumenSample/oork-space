import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConnect";
import { getAuthUser } from "@/lib/authUser";
import NocodeApp from "@/lib/models/NocodeApp";
import { uniqueSlug } from "@/lib/nocode/slug";

export async function POST(req: Request) {
  try {
    await connectDB();

    const auth = await getAuthUser();
    if (!auth?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const name = String(body?.name || "Untitled App");

    const app = await NocodeApp.create({
      userId: auth.userId,
      name,
      key: uniqueSlug(name),
    });

    return NextResponse.json({ success: true, data: app }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to create app" }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connectDB();

    const auth = await getAuthUser();
    if (!auth?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apps = await NocodeApp.find({ userId: auth.userId }).sort({ updatedAt: -1 });
    return NextResponse.json({ success: true, data: apps });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to list apps" }, { status: 500 });
  }
}