import * as XLSX from "xlsx";
import { Row } from "@/types/excel";

// Convert custom formula → Excel formula
export function convertFormula(formula: string, row: number) {
  return formula
    .replace(/price/g, `B${row}`)
    .replace(/qty/g, `C${row}`);
}

// Generate Excel workbook
export function generateWorkbook(rows: Row[]) {
  const wb = XLSX.utils.book_new();

  const sheetData: any[][] = [
    ["Product", "Price", "Qty", "Total", "Status"],
  ];

  rows.forEach((r) => {
    sheetData.push([r.product, r.price, r.qty]);
  });

  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // Apply formulas
  for (let i = 0; i < rows.length; i++) {
    const row = i + 2;

    ws[`D${row}`] = {
      f: convertFormula("price * qty", row),
    };

    ws[`E${row}`] = {
      f: `IF(D${row}>100,"High","Low")`,
    };
  }

  // Grand Total
  const totalRow = rows.length + 2;

  ws[`C${totalRow}`] = { v: "Grand Total" };
  ws[`D${totalRow}`] = {
    f: `SUM(D2:D${rows.length + 1})`,
  };

  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

  return wb;
}