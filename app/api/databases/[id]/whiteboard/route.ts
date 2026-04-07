import { NextResponse } from "next/server";
import dbConnect from "../../../../../lib/dbConnect";
import Database from "../../../../../lib/models/Database";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await req.json();
    await Database.findByIdAndUpdate(id, {
      $set: { canvasData: body.canvas, updatedAt: new Date() },
    }, { upsert: true, new: true });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[API] whiteboard POST error:", err);
    return NextResponse.json({ error: err.message ?? String(err) }, { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const db = await Database.findById(id).select("canvasData");
    return NextResponse.json({ canvas: db?.canvasData ?? null });
  } catch (err: any) {
    console.error("[API] whiteboard GET error:", err);
    return NextResponse.json({ error: err.message ?? String(err) }, { status: 500 });
  }
}