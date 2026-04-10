import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConnect";
import { getAuthUser } from "@/lib/authUser";
import NocodeWorkflow from "@/lib/models/NocodeWorkflow";
import { nextVersion } from "@/lib/nocode/versioning";

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const auth = await getAuthUser();
    if (!auth?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;
    const wf = await NocodeWorkflow.findOne({ _id: id, userId: auth.userId });
    if (!wf) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const version = nextVersion(wf.publishedGraph?.version);

    wf.publishedGraph = {
      nodes: wf.draftGraph?.nodes ?? [],
      edges: wf.draftGraph?.edges ?? [],
      version,
      publishedAt: new Date(),
    };

    wf.status = "published";
    wf.updatedAt = new Date();
    await wf.save();

    return NextResponse.json({ success: true, data: wf });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to publish workflow" }, { status: 500 });
  }
}