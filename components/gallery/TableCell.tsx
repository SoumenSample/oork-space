// "use client";

// import { useEffect, useState } from "react";

// export default function TableCell({
//   row,
//   property,
//   refreshRows,
// }: {
//   row: any;
//   property: any;
//   refreshRows: () => void;
// }) {
//   const propertyId = property._id;

//   const initialValue =
//     row.properties?.[propertyId]?.value !== undefined
//       ? row.properties[propertyId].value
//       : "";

//   const [value, setValue] = useState(initialValue);

//   useEffect(() => {
//     setValue(initialValue);
//   }, [initialValue]);

//   const save = async (newValue: any) => {
//     const newProps = {
//       ...(row.properties || {}),
//       [propertyId]: {
//         type: property.type,
//         value: newValue,
//       },
//     };

//     await fetch(`/api/items/${row._id}`, {
//       method: "PATCH",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ properties: newProps }),
//     });

//     refreshRows();
//   };

//   // checkbox special
//   if (property.type === "checkbox") {
//     return (
//       <div className="w-[220px] px-3 py-2 border-r">
//         <input
//           type="checkbox"
//           checked={!!value}
//           onChange={(e) => {
//             setValue(e.target.checked);
//             save(e.target.checked);
//           }}
//         />
//       </div>
//     );
//   }

//   return (
//     <div className="w-[220px] px-3 py-2 border-r">
//       <input
//         value={value}
//         onChange={(e) => setValue(e.target.value)}
//         onBlur={() => save(value)}
//         className="w-full bg-transparent outline-none text-sm"
//       />
//     </div>
//   );
// }


"use client";

import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { buildFormulaContext, evaluateFormula } from "@/lib/formula/evaluator";
import { Calendar } from "@heroui/react";

type RowItem = {
  _id: string;
  title?: string;
  values?: Record<string, unknown>;
};

type Property = {
  _id: string;
  name: string;
  type: string;
  options?: string[];
  formula?: string;
};

function toDateInputValue(raw: unknown): string {
  if (raw === null || raw === undefined) return "";

  const value = String(raw).trim();
  if (!value) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

export default function TableCell({
  row,
  property,
  properties,
  refreshRows,
  onCellUpdate,
}: {
  row: RowItem;
  property: Property;
  properties: Property[];
  refreshRows: () => void;
  onCellUpdate?: (rowId: string, propertyId: string, value: string | number | boolean) => void;
}) {
  const propertyId = property._id;

  const initialValue = row.values?.[propertyId] ?? "";

  const [value, setValue] = useState<string | number | boolean>(
    initialValue as string | number | boolean
  );

  useEffect(() => {
    setValue((initialValue as string | number | boolean) ?? "");
  }, [initialValue]);

  const save = async (newValue: string | number | boolean) => {
    if (onCellUpdate) {
      onCellUpdate(row._id, propertyId, newValue);
    }

    await fetch(`/api/items/${row._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ values: { [propertyId]: newValue } }),
    });

    if (!onCellUpdate) {
      refreshRows();
    }
  };

  if (property.type === "formula") {
    const ctx = buildFormulaContext({
      rowValues: row.values,
      rowTitle: row.title,
      properties: properties.map((p) => ({ _id: p._id, name: p.name })),
    });
    const result = evaluateFormula(property.formula || "", ctx);

    return (
      <div className="w-[220px] px-3 py-2 border-r flex items-center text-sm text-muted-foreground bg-muted/20">
        {String(result ?? "")}
      </div>
    );
  }

  // Checkbox cell
  if (property.type === "checkbox") {
    return (
      <div className="w-[220px] px-3 py-2 border-r flex items-center">
        <Checkbox
          checked={!!value}
          onCheckedChange={(checked) => {
            const bool = Boolean(checked);
            setValue(bool);
            save(bool);
          }}
        />
      </div>
    );
  }

  if (property.type === "select" && property.options?.length) {
    return (
      <div className="w-[220px] px-3 py-2 border-r">
        <select
          value={String(value || "")}
          onChange={(e) => {
            const next = e.target.value;
            setValue(next);
            save(next);
          }}
          className="h-9 w-full rounded-md border border-gray-200 bg-white px-2 text-sm outline-none focus:border-gray-400"
          title="Select value"
        >
          <option value="">Select...</option>
          {property.options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (property.type === "date") {
    const dateInputValue = toDateInputValue(value);

    return (
      <div className="w-[220px] px-3 py-2 border-r">
        <Input
          type="date"
          value={dateInputValue}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => save(toDateInputValue(value))}
          className="border-none shadow-none focus-visible:ring-0 px-0"
          title="Date"
        />
        {/* <Calendar/> */}
      </div>
    );
  }

  if (property.type === "number") {
    return (
      <div className="w-[220px] px-3 py-2 border-r">
        <Input
          type="number"
          value={String(value ?? "")}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => {
            const raw = String(value ?? "").trim();
            if (!raw) {
              save("");
              return;
            }
            const num = Number(raw);
            save(Number.isNaN(num) ? "" : num);
          }}
          className="border-none shadow-none focus-visible:ring-0 px-0"
          title="Number"
        />
      </div>
    );
  }

  if (property.type === "email") {
    return (
      <div className="w-[220px] px-3 py-2 border-r">
        <Input
          type="email"
          value={String(value || "")}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => save(String(value || "").trim())}
          className="border-none shadow-none focus-visible:ring-0 px-0"
          placeholder="assign@email.com"
          title="Assigned email"
        />
      </div>
    );
  }

  // Text cell
  return (
    <div className="w-[220px] px-3 py-2 border-r">
      <Input
        value={String(value ?? "")}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => save(String(value ?? ""))}
        className="border-none shadow-none focus-visible:ring-0 px-0"
        title="Text value"
      />
    </div>
  );
}
