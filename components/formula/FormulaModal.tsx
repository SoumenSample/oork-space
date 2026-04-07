"use client";

import FormulaEditor, { FormulaProperty } from "./FormulaEditor";

export type FormulaModalColumn = FormulaProperty & {
  formula?: string;
};

export default function FormulaModal({
  columns,
  formulaColumn,
  onChange,
  onClose,
}: {
  columns: FormulaProperty[];
  formulaColumn: FormulaModalColumn | null;
  onChange: (value: string) => void | Promise<void>;
  onClose: () => void;
}) {
  if (!formulaColumn) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[500px] rounded-xl bg-white p-4 dark:bg-[#1f1f1f]">
        <h2 className="mb-3 text-lg font-semibold">Edit Formula: {formulaColumn.name}</h2>

        <FormulaEditor
          properties={columns}
          value={formulaColumn.formula || ""}
          onChange={onChange}
        />

        <button
          onClick={onClose}
          className="mt-4 rounded bg-blue-500 px-3 py-1 text-white"
        >
          Close
        </button>
      </div>
    </div>
  );
}