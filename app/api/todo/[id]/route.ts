import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConnect";
import TodoTask from "@/lib/models/TodoTask";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  await connectDB();

  const { id } = await context.params;
  const body = await req.json();

  const updated = await TodoTask.findByIdAndUpdate(
    id,
    { $set: body },
    { new: true }
  );

  if (!updated) {
    return NextResponse.json({ message: "Task not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  await connectDB();

  const { id } = await context.params;
  await TodoTask.findByIdAndDelete(id);

  return NextResponse.json({ success: true });
}
