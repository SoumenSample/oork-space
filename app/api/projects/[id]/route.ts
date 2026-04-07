// app/api/projects/[id]/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Project from "@/lib/models/Project";
import { getAuthUser } from "@/lib/authUser";

/* ── PATCH /api/projects/:id ── */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();
  const { id } = await params;
  const authUser = await getAuthUser();
  if (!authUser?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body    = await req.json();
  const allowed = ["name", "emoji", "status", "priority", "progress", "description", "dueDate"];
  const patch: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) patch[key] = body[key];
  }

  const project = await Project.findOneAndUpdate(
    { _id: id, ownerId: authUser.userId },
    { $set: patch },
    { new: true }
  );

  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(project);
}

/* ── DELETE /api/projects/:id ── */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();
  const { id } = await params;
  const authUser = await getAuthUser();
  if (!authUser?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await Project.findOneAndDelete({ _id: id, ownerId: authUser.userId });
  return NextResponse.json({ success: true });
}

/* ── GET /api/projects/:id ── */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();
  const { id } = await params;
  const authUser = await getAuthUser();
  if (!authUser?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const project = await Project.findOne({ _id: id, ownerId: authUser.userId });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(project);
}