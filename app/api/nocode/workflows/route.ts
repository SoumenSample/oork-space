import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConnect";
import { getAuthUser } from "@/lib/authUser";
import NocodeWorkflow from "@/lib/models/NocodeWorkflow";
import NocodeApp from "@/lib/models/NocodeApp";
import { uniqueSlug } from "@/lib/nocode/slug";

export async function POST(req: Request) {
  try {
    await connectDB();
    const auth = await getAuthUser();
    if (!auth?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const appId = String(body?.appId || "");
    const name = String(body?.name || "Untitled Workflow");

    const app = await NocodeApp.findOne({ _id: appId, userId: auth.userId });
    if (!app) return NextResponse.json({ error: "App not found" }, { status: 404 });

    const wf = await NocodeWorkflow.create({
      userId: auth.userId,
      appId,
      name,
      key: uniqueSlug(name),
      draftGraph: { nodes: [], edges: [] },
      publishedGraph: { nodes: [], edges: [], version: 0, publishedAt: null },
      status: "draft",
    });

    return NextResponse.json({ success: true, data: wf }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to create workflow" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    await connectDB();
    const auth = await getAuthUser();
    if (!auth?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const appId = url.searchParams.get("appId");
    const query: Record<string, unknown> = { userId: auth.userId };
    if (appId) query.appId = appId;

    const workflows = await NocodeWorkflow.find(query).sort({ updatedAt: -1 });
    return NextResponse.json({ success: true, data: workflows });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to list workflows" }, { status: 500 });
  }
}