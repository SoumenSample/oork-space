// import { NextResponse } from "next/server";
// import connectDB from "@/lib/dbConnect";
// import TodoTask from "@/lib/models/TodoTask";

// export async function GET(
//   req: Request,
//   context: { params: Promise<{ id: string }> }
// ) {
//   await connectDB();
//   const { id } = await context.params;

//   const task = await TodoTask.findById(id);

//   if (!task) {
//     return NextResponse.json({ message: "Task not found" }, { status: 404 });
//   }

//   return NextResponse.json(task);
// }

// export async function PATCH(
//   req: Request,
//   context: { params: Promise<{ id: string }> }
// ) {
//   await connectDB();
//   const { id } = await context.params;

//   const body = await req.json();

//   const updated = await TodoTask.findByIdAndUpdate(
//     id,
//     { $set: body },
//     { new: true }
//   );

//   return NextResponse.json(updated);
// }





import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConnect";
import TodoTask from "@/lib/models/TodoTask";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  await connectDB();
  const { id } = await context.params;

  const task = await TodoTask.findById(id);

  if (!task) {
    return NextResponse.json({ message: "Task not found" }, { status: 404 });
  }

  return NextResponse.json(task);
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  await connectDB();
  const { id } = await context.params;

  const body = await req.json();
  
  console.log("🔄 Updating task:", id);
  console.log("🔄 Update data:", body);

  const updated = await TodoTask.findByIdAndUpdate(
    id,
    { $set: body },
    { new: true }
  );

  console.log("✅ Updated task:", updated);

  return NextResponse.json(updated);
}
