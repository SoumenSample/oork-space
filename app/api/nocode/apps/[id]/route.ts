import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConnect";
import { getAuthUser } from "@/lib/authUser";
import NocodeApp from "@/lib/models/NocodeApp";
import NocodePage from "@/lib/models/NocodePage";
import NocodeWorkflow from "@/lib/models/NocodeWorkflow";
import NocodeRun from "@/lib/models/NocodeRun";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const auth = await getAuthUser();
    if (!auth?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const name = String(body?.name || "").trim();

    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const updated = await NocodeApp.findOneAndUpdate(
      { _id: id, userId: auth.userId },
      { $set: { name } },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: "App not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to rename app" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const auth = await getAuthUser();
    if (!auth?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const app = await NocodeApp.findOne({ _id: id, userId: auth.userId }).select("_id");
    if (!app) {
      return NextResponse.json({ error: "App not found" }, { status: 404 });
    }

    await Promise.all([
      NocodeRun.deleteMany({ appId: app._id }),
      NocodeWorkflow.deleteMany({ appId: app._id }),
      NocodePage.deleteMany({ appId: app._id }),
    ]);

    await NocodeApp.deleteOne({ _id: app._id, userId: auth.userId });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to delete app" }, { status: 500 });
  }
}
