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

    const wf = await NocodeWorkflow.findOneAndUpdate(
      { _id: id, userId: auth.userId },
      {
        $set: {
          name: typeof body?.name === "string" ? body.name : undefined,
          "draftGraph.nodes": Array.isArray(body?.draftGraph?.nodes) ? body.draftGraph.nodes : [],
          "draftGraph.edges": Array.isArray(body?.draftGraph?.edges) ? body.draftGraph.edges : [],
          updatedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!wf) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ success: true, data: wf });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to save workflow" }, { status: 500 });
  }
}