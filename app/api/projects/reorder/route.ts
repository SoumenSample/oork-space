import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Database from "@/lib/models/Database";
import Project from "@/lib/models/Project";
import { getAuthUser } from "@/lib/authUser";

export async function GET(req: Request) {
  try {
    await dbConnect();
    const authUser = await getAuthUser();
    if (!authUser?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    // ✅ Always return valid JSON — empty array instead of empty body
    if (!projectId) return NextResponse.json([]);

    const ownedProject = await Project.findOne({ _id: projectId, ownerId: authUser.userId }).select("_id");
    if (!ownedProject) return NextResponse.json([]);

    const dbs = await Database.find({ projectId, ownerId: authUser.userId }).sort({ createdAt: 1 });
    return NextResponse.json(dbs);
  } catch (err: any) {
    console.error("GET /api/databases error:", err);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const authUser = await getAuthUser();
    if (!authUser?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();

    if (!body.projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }
    if (!body.name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }
    if (!body.viewType) {
      return NextResponse.json({ error: "viewType is required" }, { status: 400 });
    }

    const ownedProject = await Project.findOne({ _id: body.projectId, ownerId: authUser.userId }).select("_id");
    if (!ownedProject) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const db = await Database.create({
      ownerId: authUser.userId,
      projectId: body.projectId,
      name: body.name,
      icon: body.icon || "📄",
      viewType: body.viewType,
      templateName: body.templateName || "blank",
    });

    return NextResponse.json(db);
  } catch (err: any) {
    console.error("POST /api/databases error:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}