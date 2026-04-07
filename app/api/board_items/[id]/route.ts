import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConnect";
import DatabaseItem from "@/lib/models/DatabaseItem";
import { getAuthUser } from "@/lib/authUser";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  await connectDB();
  const authUser = await getAuthUser();

  if (!authUser?.userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const { values } = await req.json();

  const updated = await DatabaseItem.findOneAndUpdate(
    { _id: id, ownerId: authUser.userId },
    { $set: { values } },
    { new: true }
  );

  if (!updated) {
    return NextResponse.json({ message: "Item not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}