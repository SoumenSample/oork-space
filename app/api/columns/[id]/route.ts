import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConnect";
import DatabaseColumn from "@/lib/models/TableColumn";



export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { message: "Column id missing in route" },
        { status: 400 }
      );
    }

    const body = await req.json();

    const updated = await DatabaseColumn.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true }
    );

    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json(
      { message: err.message || "Update failed" },
      { status: 500 }
    );
  }
}



export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();
  const { id } = await params;
  await DatabaseColumn.findByIdAndDelete(id);

  return NextResponse.json({ success: true });
}


