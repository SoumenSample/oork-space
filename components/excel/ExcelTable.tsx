"use client";

import React, { useState } from "react";
import { Row } from "@/types/excel";

export default function ExcelTable() {
  const [rows, setRows] = useState<Row[]>([
    { product: "Pen", price: 10, qty: 2 },
  ]);

  // Add row
  const addRow = () => {
    setRows([...rows, { product: "", price: 0, qty: 0 }]);
  };

  // Update cell
  const updateRow = (i: number, key: keyof Row, value: string | number) => {
    const updated = [...rows];
    if (key === "product") {
      updated[i][key] = String(value);
    } else {
      updated[i][key] = Number(value);
    }
    setRows(updated);
  };

  // Call backend
  const exportExcel = async () => {
    const res = await fetch("/api/excel", {
      method: "POST",
      body: JSON.stringify({ rows }),
    });

    const blob = await res.blob();

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sheet.xlsx";
    a.click();
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold">Excel Table</h1>

      <table className="border w-full">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Product</th>
            <th className="border p-2">Price</th>
            <th className="border p-2">Qty</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              <td className="border p-2">
                <input
                  value={row.product}
                  onChange={(e) =>
                    updateRow(i, "product", e.target.value)
                  }
                  className="w-full"
                />
              </td>

              <td className="border p-2">
                <input
                  type="number"
                  value={row.price}
                  onChange={(e) =>
                    updateRow(i, "price", e.target.value)
                  }
                  className="w-full"
                />
              </td>

              <td className="border p-2">
                <input
                  type="number"
                  value={row.qty}
                  onChange={(e) =>
                    updateRow(i, "qty", e.target.value)
                  }
                  className="w-full"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex gap-3">
        <button
          onClick={addRow}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          + Add Row
        </button>

        <button
          onClick={exportExcel}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Export
        </button>
      </div>
    </div>
  );
}