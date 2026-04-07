import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConnect";
import DatabaseRow from "@/lib/models/TableRow";
import DatabaseColumn from "@/lib/models/TableColumn";

export async function PATCH(req: Request) {
  await connectDB();
  const body = await req.json();

  const { rowId, columnId, value, databaseId } = body;

  if (!rowId || !columnId) {
    return NextResponse.json(
      { message: "rowId and columnId are required" },
      { status: 400 }
    );
  }

  const row = await DatabaseRow.findById(rowId).select("_id databaseId");
  if (!row) {
    return NextResponse.json({ message: "Row not found" }, { status: 404 });
  }

  const col = await DatabaseColumn.findById(columnId).select("_id databaseId");
  if (!col) {
    return NextResponse.json({ message: "Column not found" }, { status: 404 });
  }

  const rowDbId = String(row.databaseId);
  const colDbId = String(col.databaseId);
  if (rowDbId !== colDbId) {
    return NextResponse.json(
      { message: "Row and column belong to different tables" },
      { status: 400 }
    );
  }

  if (databaseId && String(databaseId) !== rowDbId) {
    return NextResponse.json(
      { message: "databaseId does not match row table" },
      { status: 400 }
    );
  }

  const updated = await DatabaseRow.findByIdAndUpdate(
    rowId,
    {
      $set: {
        [`cells.${columnId}`]: value,
        updatedAt: new Date(),
      },
    },
    { new: true }
  );

  return NextResponse.json(updated);
}
