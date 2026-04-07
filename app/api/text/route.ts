import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConnect";
import TextBlock from "@/lib/models/TextBlock";

export async function GET(req: Request) {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const databaseId = searchParams.get("databaseId");

  if (!databaseId) {
    return NextResponse.json({ message: "databaseId missing" }, { status: 400 });
  }

  const blocks = await TextBlock.find({ databaseId }).sort({ createdAt: 1 });
  return NextResponse.json(blocks);
}

export async function POST(req: Request) {
  await connectDB();

  const body = await req.json();
  const created = await TextBlock.create({
    databaseId: body.databaseId,
    title: body.title || "Text",
    content: body.content || "",
  });

  return NextResponse.json(created);
}
