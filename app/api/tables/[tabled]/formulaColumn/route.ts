import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import FormulaColumn from "@/lib/models/FormulaColumn";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ tabled: string }> }
) {
  try {
    await dbConnect();
    const { tabled } = await params;

    const columns = await FormulaColumn.find({
      tableId: tabled,
    });

    return NextResponse.json(columns);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch formula columns" },
      { status: 500 }
    );
  }
}