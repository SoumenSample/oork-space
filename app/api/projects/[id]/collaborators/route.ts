import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Project from "@/lib/models/Project";
import { getAuthUser } from "@/lib/authUser";

type Role = "viewer" | "commenter" | "editor";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();
  const { id } = await params;

  const authUser = await getAuthUser();
  if (!authUser?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const authEmail = String(authUser.email || "").trim().toLowerCase();

  const project = await Project.findOne({ _id: id }).select("ownerId collaborators");
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const isOwner = String(project.ownerId) === String(authUser.userId);
  const isCollaborator = Array.isArray(project.collaborators)
    ? project.collaborators.some((c: any) => String(c.email || "").toLowerCase() === authEmail)
    : false;

  if (!isOwner && !isCollaborator) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    success: true,
    collaborators: project.collaborators || [],
  });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();
  const { id } = await params;

  const authUser = await getAuthUser();
  if (!authUser?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const email = String(body.email || "").trim().toLowerCase();
  const role = String(body.role || "viewer") as Role;

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  if (!["viewer", "commenter", "editor"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const project = await Project.findOne({ _id: id, ownerId: authUser.userId });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const collaborators = Array.isArray(project.collaborators) ? project.collaborators : [];
  const existing = collaborators.find((c: any) => String(c.email).toLowerCase() === email);

  if (existing) {
    existing.role = role;
    existing.status = existing.status || "pending";
  } else {
    collaborators.push({
      email,
      role,
      status: "pending",
      addedAt: new Date(),
    });
  }

  project.collaborators = collaborators;
  await project.save();

  return NextResponse.json({
    success: true,
    collaborators: project.collaborators || [],
  });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();
  const { id } = await params;

  const authUser = await getAuthUser();
  if (!authUser?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const email = String(body.email || "").trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const project = await Project.findOneAndUpdate(
    { _id: id, ownerId: authUser.userId },
    { $pull: { collaborators: { email } } },
    { new: true }
  ).select("collaborators");

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    collaborators: project.collaborators || [],
  });
}
