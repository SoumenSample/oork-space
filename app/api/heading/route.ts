import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConnect";
import HeadingBlock from "@/lib/models/HeadingBlock";

export async function GET(req: Request) {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const databaseId = searchParams.get("databaseId");

  if (!databaseId) {
    return NextResponse.json({ message: "databaseId missing" }, { status: 400 });
  }

  const headings = await HeadingBlock.find({ databaseId }).sort({
    createdAt: 1,
  });

  return NextResponse.json(headings);
}

export async function POST(req: Request) {
  await connectDB();

  const body = await req.json();

  const created = await HeadingBlock.create({
    databaseId: body.databaseId,
    text: body.text || "",
    level: body.level || "h1",
  });

  return NextResponse.json(created);
}
