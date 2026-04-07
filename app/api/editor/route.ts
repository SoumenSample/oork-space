import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConnect";
import Editor from "../../../lib/models/Editor";

// ✅ SAVE DATA
export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();
    console.log("Received data:", body); // 🔥 DEBUG LOG

    const newDoc = await Editor.create({
      content: body,
    });

    return NextResponse.json({
      success: true,
      data: newDoc,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error,
    });
  }
}

// ✅ GET DATA
export async function GET() {
  await connectDB();

  const data = await Editor.find().sort({ createdAt: -1 });

  return NextResponse.json(data);
}