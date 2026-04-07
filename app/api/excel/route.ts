import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { generateWorkbook } from "@/lib/Excel";

export async function POST(req: Request) {
  const body = await req.json();
  const rows = body.rows;

  const wb = generateWorkbook(rows);

  const buffer = XLSX.write(wb, {
    type: "buffer",
    bookType: "xlsx",
  });

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Disposition": "attachment; filename=sheet.xlsx",
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  });
}