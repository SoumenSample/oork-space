import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Database from "@/lib/models/Database";

function parseCSV(text: string) {
  const lines = text.split("\n").filter(Boolean);
  if (!lines.length) return [];

  const headers = lines[0].split(",").map((h) => h.trim());

  return lines.slice(1).map((line) => {
    const values = line.split(",");
    const row: Record<string, any> = {};

    headers.forEach((header, i) => {
      row[header] = values[i]?.trim() || "";
    });

    return row;
  });
}

export async function POST(req: Request) {
  try {
    await dbConnect();

    const formData = await req.formData();

    const file = formData.get("file") as File;
    const projectId = formData.get("projectId") as string;
    const viewType = formData.get("viewType") as string;

    if (!file || !projectId) {
      return NextResponse.json(
        { error: "file and projectId required" },
        { status: 400 }
      );
    }

    const text = await file.text();
    const rows = parseCSV(text);

    const db = await Database.create({
      projectId,
      name: file.name.replace(".csv", ""),
      icon: "📄",
      viewType,
      rows,
    });

    return NextResponse.json({
      success: true,
      rowsImported: rows.length,
      database: db,
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: "CSV import failed" },
      { status: 500 }
    );
  }
}