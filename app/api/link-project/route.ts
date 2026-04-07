// import { NextResponse } from "next/server";

// // Fake DB (replace with real DB)
// let tasks: any[] = [
//   { id: "task1", title: "Task 1", linkedProjectIds: [] },
// ];

// export async function POST(req: Request) {
//   const { taskId, projectIds } = await req.json();

//   tasks = tasks.map((task) =>
//     task.id === taskId
//       ? { ...task, linkedProjectIds: projectIds }
//       : task
//   );

//   return NextResponse.json({
//     message: "Linked updated",
//     task,
//   });
// }
import { NextResponse } from "next/server";

// Fake DB
let tasks: any[] = [
  { id: "task1", title: "Task 1", linkedProjectIds: [] },
];

export async function POST(req: Request) {
  const { taskId, projectIds } = await req.json();

  let updatedTask = null; // ✅ define variable

  tasks = tasks.map((task) => {
    if (task.id === taskId) {
      updatedTask = { ...task, linkedProjectIds: projectIds };
      return updatedTask;
    }
    return task;
  });

  return NextResponse.json({
    message: "Linked updated",
    task: updatedTask, // ✅ now valid
  });
}