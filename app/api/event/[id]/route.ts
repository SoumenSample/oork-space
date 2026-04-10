// import { NextResponse } from "next/server";
// import connectDB from "@/lib/dbConnect";
// import Event from "../../../../lib/models/Event";

// export async function DELETE(
//   req: Request,
//   { params }: { params: { id: string } }
// ) {
//   await connectDB();

//   await Event.findByIdAndDelete(params.id);
//   alert("Event deleted");

//   return NextResponse.json({ message: "Deleted" });

// }
import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConnect";
import Event from "@/lib/models/Event";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    const deleted = await Event.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    console.log("Deleted ID:", id);

    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    console.error("Delete Error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    const body = await req.json();

    const updatedEvent = await Event.findByIdAndUpdate(
      id,
      {
        title: body.title,
        description: body.description,
        assigned: body.assigned,
        fromDate: body.fromDate,
        toDate: body.toDate,
        time: body.time,
      },
      { new: true } // return updated doc
    );

    if (!updatedEvent) {
      return NextResponse.json(
        { message: "Event not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedEvent, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error updating event" },
      { status: 500 }
    );
  }
}
