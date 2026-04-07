import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConnect";
import DatabaseItem from "@/lib/models/GalleryItem";

export async function GET(req: Request) {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const databaseId = searchParams.get("databaseId");

  if (!databaseId) return NextResponse.json([]);

  const items = await DatabaseItem.find({ databaseId }).sort({ createdAt: 1 });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  await connectDB();
  const body = await req.json();

  // Provide default dates for timeline view
  const now = new Date();
  const defaultEndDate = new Date(now);
  defaultEndDate.setDate(defaultEndDate.getDate() + 7); // 7 days from now

  const item = await DatabaseItem.create({
    ...body,
    startDate: body.startDate || now,
    endDate: body.endDate || defaultEndDate,
  });
  return NextResponse.json(item);
}
