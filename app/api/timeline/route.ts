import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConnect";
import DatabaseItem from "@/lib/models/GalleryItem";

export async function GET(req: Request) {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const databaseId = searchParams.get("databaseId");

  if (!databaseId) return NextResponse.json([]);

  const items = await DatabaseItem.find({ databaseId }).sort({ startDate: 1 });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  await connectDB();

  const body = await req.json();

  // body must include: databaseId, startDate, endDate
  const item = await DatabaseItem.create(body);

  return NextResponse.json(item);
}
