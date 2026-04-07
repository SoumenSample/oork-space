import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConnect";
import DatabaseRow from "@/lib/models/TableRow";

export async function GET(req: Request) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const databaseId = searchParams.get("databaseId");

  if (!databaseId) return NextResponse.json([], { status: 200 });

  const rows = await DatabaseRow.find({ databaseId }).sort({ createdAt: 1 });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  await connectDB();
  const body = await req.json();
  const { databaseId } = body;

  if (!databaseId) {
    return NextResponse.json(
      { message: "databaseId is required" },
      { status: 400 }
    );
  }

  const row = await DatabaseRow.create({
    databaseId,
    cells: {},
    createdBy: "system",
    updatedBy: "system",
  });

  return NextResponse.json(row);
}
