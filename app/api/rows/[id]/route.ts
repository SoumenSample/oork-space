import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConnect";
import DatabaseRow from "@/lib/models/TableRow";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();
  const { id } = await params;
  const body = await req.json();

  const updated = await DatabaseRow.findByIdAndUpdate(
    id,
    {
      $set: body,
    },
    { new: true }
  );

  return NextResponse.json(updated);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();
  const { id } = await params;
  await DatabaseRow.findByIdAndDelete(id);

  return NextResponse.json({ success: true });
}
