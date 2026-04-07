// import { NextResponse } from "next/server";

// const tasks = [
//   {
//     id: "task1",
//     title: "Task 1",
//     linkedProjectIds: ["1", "2"],
//   },
// ];

// export async function GET(
//   req: Request,
//   { params }: { params: { id: string } }
// ) {
//   const task = tasks.find((t) => t.id === params.id);
//   return NextResponse.json(task);
// }
import { NextResponse } from "next/server";

const tasks = [
  {
    id: "task1",
    title: "Task 1",
    linkedProjectIds: ["1", "2"],
  },
];

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> } // ✅ params is Promise
) {
  const { id } = await context.params; // ✅ unwrap

  const task = tasks.find((t) => t.id === id);

  if (!task) {
    return NextResponse.json(
      { error: "Task not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(task);
}