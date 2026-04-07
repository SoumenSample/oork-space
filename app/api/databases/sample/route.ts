import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Database from "@/lib/models/Database";

export async function POST(req: Request) {
  try {
    await dbConnect();

    const body = await req.json();
    const { projectId, name, icon, viewType, rows } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId required" },
        { status: 400 }
      );
    }

    const db = await Database.create({
      projectId,
      name: name || "Sample Database",
      icon: icon || "📊",
      viewType,
      rows: rows || [],
    });

    return NextResponse.json({
      success: true,
      database: db,
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: "Failed to create sample database" },
      { status: 500 }
    );
  }
}