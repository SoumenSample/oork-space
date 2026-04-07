import { NextResponse } from "next/server";
import dbConnect from "../../../../../lib/dbConnect";
import Database from "../../../../../lib/models/Database";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
    const db = await Database.findById(id).select("videoData");
    return NextResponse.json({ clips: db?.videoData ?? null });
  } catch (err: any) {
    console.error("[API] video GET error:", err);
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
    const body = await req.json();
    await Database.findByIdAndUpdate(id, { $set: { videoData: body.clips, updatedAt: new Date() } }, { upsert: true, new: true });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[API] video POST error:", err);
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}