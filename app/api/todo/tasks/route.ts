import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConnect";
import TodoTask from "@/lib/models/TodoTask";

export async function GET(req: Request) {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const databaseId = searchParams.get("databaseId");

  if (!databaseId) {
    return NextResponse.json({ error: "databaseId missing" }, { status: 400 });
  }

  const tasks = await TodoTask.find({ databaseId }).sort({ createdAt: -1 });
  return NextResponse.json(tasks);
}

export async function POST(req: Request) {
  await connectDB();
  const body = await req.json();

  console.log("📝 Creating todo task with body:", body);
  console.log("📝 Title being set:", body.title || "new task");
  console.log("📝 Completed being set:", body.completed || false);

  const created = await TodoTask.create({
    databaseId: body.databaseId,
    title: body.title || "new task",
    completed: body.completed || false,
    values: body.values || {},
  });

  console.log("✅ Created task:", created);
  console.log("✅ Created task title:", created.title);
  console.log("✅ Created task completed:", created.completed);

  return NextResponse.json(created);
}
