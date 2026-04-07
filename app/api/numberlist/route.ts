import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConnect";
import NumberListBlock from "@/lib/models/NumberListBlock";

export async function GET(req: Request) {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const databaseId = searchParams.get("databaseId");

  if (!databaseId) {
    return NextResponse.json({ message: "databaseId missing" }, { status: 400 });
  }

  const items = await NumberListBlock.find({ databaseId }).sort({
    order: 1,
    createdAt: 1,
  });

  return NextResponse.json(items);
}

export async function POST(req: Request) {
  await connectDB();
  const body = await req.json();

  // find last order
  const last = await NumberListBlock.findOne({ databaseId: body.databaseId })
    .sort({ order: -1 })
    .lean() as { order: number } | null;

  const nextOrder = last ? last.order + 1 : 1;

  const created = await NumberListBlock.create({
    databaseId: body.databaseId,
    text: body.text || "",
    order: nextOrder,
  });

  return NextResponse.json(created);
}
