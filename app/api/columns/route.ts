import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConnect";
import DatabaseColumn from "@/lib/models/TableColumn";

export async function GET(req: Request) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const databaseId = searchParams.get("databaseId");

  if (!databaseId) return NextResponse.json([], { status: 200 });

  const cols = await DatabaseColumn.find({ databaseId }).sort({ order: 1 });
  return NextResponse.json(cols);
}

export async function POST(req: Request) {
  await connectDB();
  const body = await req.json();
  const { databaseId, name, type, options, order } = body;

  if (!databaseId) {
    return NextResponse.json(
      { message: "databaseId is required" },
      { status: 400 }
    );
  }

  const col = await DatabaseColumn.create({
    databaseId,
    name: name || "New column",
    type: type || "text",
    options: options || [],
    order: Number.isFinite(order) ? order : 0,
  });

  return NextResponse.json(col);
}
