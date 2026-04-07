import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import FormulaColumn from "@/lib/models/FormulaColumn";

export async function PATCH(
  req: NextRequest,
  _context: { params: Promise<{}> }
) {
  try {
    await dbConnect();
    const body = await req.json();
    const id = body?.id ?? req.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Formula column id is required" },
        { status: 400 }
      );
    }

    const updated = await FormulaColumn.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json(
        { error: "Formula column not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update formula column" },
      { status: 500 }
    );
  }
}