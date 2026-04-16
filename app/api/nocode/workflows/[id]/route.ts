import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConnect";
import { getAuthUser } from "@/lib/authUser";
import NocodeWorkflow from "@/lib/models/NocodeWorkflow";

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const auth = await getAuthUser();
    if (!auth?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;
    const wf = await NocodeWorkflow.findOne({ _id: id, userId: auth.userId });
    if (!wf) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ success: true, data: wf });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch workflow" }, { status: 500 });
  }
}

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const auth = await getAuthUser();
    if (!auth?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;
    const body = await req.json();

    const setPayload: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (typeof body?.name === "string") {
      const nextName = body.name.trim();
      if (nextName) setPayload.name = nextName;
    }

    if (body?.draftGraph && typeof body.draftGraph === "object") {
      if (Array.isArray(body?.draftGraph?.nodes)) {
        setPayload["draftGraph.nodes"] = body.draftGraph.nodes;
      }
      if (Array.isArray(body?.draftGraph?.edges)) {
        setPayload["draftGraph.edges"] = body.draftGraph.edges;
      }
    }

    const wf = await NocodeWorkflow.findOneAndUpdate(
      { _id: id, userId: auth.userId },
      {
        $set: setPayload,
      },
      { new: true }
    );

    if (!wf) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ success: true, data: wf });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to save workflow" }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const auth = await getAuthUser();
    if (!auth?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;
    const wf = await NocodeWorkflow.findOneAndDelete({ _id: id, userId: auth.userId });
    if (!wf) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to delete workflow" }, { status: 500 });
  }
}