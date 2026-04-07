import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConnect";
import DatabaseItem from "@/lib/models/GalleryItem";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();
  
  const { id } = await params;
  const body = await req.json();

  console.log('=== API PATCH DEBUG ===');
  console.log('ID:', id);
  console.log('Body received:', JSON.stringify(body, null, 2));

  // Find the document first
  const existing = await DatabaseItem.findById(id);
  console.log('Existing document before update:', existing);

  // Update using $set to ensure all fields are updated
  const updated = await DatabaseItem.findByIdAndUpdate(
    id,
    {
      $set: {
        title: body.title,
        startDate: body.startDate,
        endDate: body.endDate,
        assignedTo: body.assignedTo || "",
        status: body.status,
        comment: body.comment || "",
      }
    },
    {
      new: true,
      runValidators: false,
    }
  );

  console.log('Updated document:', JSON.stringify(updated, null, 2));

  // Verify the update worked
  const verified = await DatabaseItem.findById(id);
  console.log('Verified after update - assignedTo:', verified?.assignedTo);
  console.log('Verified after update - comment:', verified?.comment);

  return NextResponse.json(verified);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();
  
  const { id } = await params;

  await DatabaseItem.findByIdAndDelete(id);

  return NextResponse.json({ success: true });
}
