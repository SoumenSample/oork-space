import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConnect";
import TodoTask from "@/lib/models/TodoTask";

export async function GET(req: Request) {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const databaseId = searchParams.get("databaseId");

  if (!databaseId) {
    return NextResponse.json({ message: "databaseId missing" }, { status: 400 });
  }

  const tasks = await TodoTask.find({ databaseId }).sort({ position: 1 });

  return NextResponse.json(tasks);
}

export async function POST(req: Request) {
  await connectDB();
  const body = await req.json();

  if (!body.databaseId) {
    return NextResponse.json({ message: "databaseId missing" }, { status: 400 });
  }

  const created = await TodoTask.create({
    databaseId: body.databaseId,
    title: body.title || "New task",
    completed: false,
    position: body.position || 0,
  });

  return NextResponse.json(created);
}


// import { NextResponse } from "next/server";
// import connectDB from "@/lib/dbConnect";
// import TodoTask from "@/lib/models/TodoTask";

// const DEFAULT_TASKS = [
//   "Welcome to your to-do list ✨",
//   "Click the checkbox to complete a task",
//   "Click the text to edit",
//   "Press + New to add more tasks",
// ];

// export async function GET(req: Request) {
//   await connectDB();

//   const { searchParams } = new URL(req.url);
//   const databaseId = searchParams.get("databaseId");

//   if (!databaseId) {
//     return NextResponse.json({ message: "databaseId missing" }, { status: 400 });
//   }

//   // check tasks
//   const count = await TodoTask.countDocuments({ databaseId });

//   // ✅ If empty -> seed defaults only once
//   if (count === 0) {
//     await TodoTask.insertMany(
//       DEFAULT_TASKS.map((title, i) => ({
//         databaseId,
//         title,
//         completed: false,
//         position: i,
//         isDefault: true,
//       }))
//     );
//   }

//   const tasks = await TodoTask.find({ databaseId }).sort({ position: 1 });

//   return NextResponse.json(tasks);
// }

// export async function POST(req: Request) {
//   await connectDB();
//   const body = await req.json();

//   if (!body.databaseId) {
//     return NextResponse.json({ message: "databaseId missing" }, { status: 400 });
//   }

//   const created = await TodoTask.create({
//     databaseId: body.databaseId,
//     title: body.title || "New task",
//     completed: false,
//     position: body.position || 9999,
//     isDefault: false,
//   });

//   return NextResponse.json(created);
// }
