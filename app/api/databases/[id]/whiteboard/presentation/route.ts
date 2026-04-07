import { NextResponse } from "next/server";
import dbConnect from "../../../../../../lib/dbConnect";
import Database from "../../../../../../lib/models/Database";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await dbConnect();
  const { id } = await params;
  const db = await Database.findById(id).select("presentationData");
  return NextResponse.json({ slides: db?.presentationData ?? null });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await dbConnect();
  const { id } = await params;
  const body = await req.json();
  await Database.findByIdAndUpdate(id, { $set: { presentationData: body.slides } });
  return NextResponse.json({ ok: true });
}