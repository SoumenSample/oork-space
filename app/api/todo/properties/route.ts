import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConnect";
import TodoProperty from "@/lib/models/TodoProperty";

export async function GET(req: Request) {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const databaseId = searchParams.get("databaseId");

  if (!databaseId) {
    return NextResponse.json({ error: "databaseId missing" }, { status: 400 });
  }

  const properties = await TodoProperty.find({ databaseId }).sort({
    createdAt: 1,
  });
  return NextResponse.json(properties);
}

export async function POST(req: Request) {
  await connectDB();
  const body = await req.json();

  const created = await TodoProperty.create({
    databaseId: body.databaseId,
    name: body.name,
    type: body.type,
    options: body.options || [],
  });

  return NextResponse.json(created);
}
