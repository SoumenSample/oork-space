import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConnect";
import DatabaseItem from "@/lib/models/DatabaseItem";
import Database from "@/lib/models/Database";
import { getAuthUser } from "@/lib/authUser";
import nodemailer from "nodemailer";
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "kayalabhi04@gmail.com",
    pass:"jzdwcsrquixkekyf",
  },
});
export async function GET(req: Request) {
  await connectDB();
  const authUser = await getAuthUser();
  if (!authUser?.userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const databaseId = searchParams.get("databaseId");
  const mode = searchParams.get("mode");

  // Assigned mode: return tasks assigned to current user's email, including tasks from other owners.
  if (mode === "assigned") {
    if (!authUser.email) {
      return NextResponse.json([], { status: 200 });
    }

    const assignedQuery: Record<string, unknown> = {
      $or: [
        { "values.assignee": authUser.email },
        { "values.email": authUser.email },
      ],
    };

    if (databaseId) {
      assignedQuery.databaseId = databaseId;
    }

    const assignedItems = await DatabaseItem.find(assignedQuery).sort({
      createdAt: -1,
    });

    return NextResponse.json(assignedItems);
  }

  if (!databaseId) {
    return NextResponse.json([], { status: 200 });
  }

  const ownedDatabase = await Database.findOne({ _id: databaseId, ownerId: authUser.userId }).select("_id");
  if (!ownedDatabase) return NextResponse.json([], { status: 200 });

  const items = await DatabaseItem.find({ databaseId, ownerId: authUser.userId }).sort({
    createdAt: -1,
  });

  return NextResponse.json(items);
}

export async function POST(req: Request) {
  await connectDB();
  const authUser = await getAuthUser();
  if (!authUser?.userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { databaseId, values } = body;

  if (!databaseId) {
    return NextResponse.json(
      { message: "databaseId required" },
      { status: 400 }
    );
  }

  const ownedDatabase = await Database.findOne({ _id: databaseId, ownerId: authUser.userId }).select("_id");
  if (!ownedDatabase) {
    return NextResponse.json({ message: "Database not found" }, { status: 404 });
  }

  const created = await DatabaseItem.create({
    ownerId: authUser.userId,
    databaseId,
    values: values || {},
  });
  await transporter.sendMail({
  from: process.env.EMAIL,
  to: values.email, // 👈 email from your form
  subject: "New Task Assigned",
  html: `
    <h2>New Task Assigned</h2>
    <p><b>Title:</b> ${values.title}</p>
    <p><b>Description:</b> ${values.description}</p>
    <p><b>From:</b> ${values.fromDate}</p>
    <p><b>To:</b> ${values.toDate}</p>
    <p><b>Milestones:</b> ${values.milestones?.map((m: { title?: string }) => m.title || "").join(", ") || "None"}</p>
  `,
});
console.log("Email sent to:", values.email);

  return NextResponse.json(created);
}
