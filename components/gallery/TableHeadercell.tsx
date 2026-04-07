// "use client";

// import { useEffect, useState } from "react";
// import PropertyTypePicker from "./PropertyTypepicker";

// export default function TableHeaderCell({
//   property,
//   refresh,
// }: {
//   property: any;
//   refresh: () => void;
// }) {
//   const [name, setName] = useState(property.name);

//   useEffect(() => {
//     setName(property.name);
//   }, [property.name]);

//   const saveName = async () => {
//     if (!name.trim()) {
//       setName(property.name);
//       return;
//     }

//     await fetch(`/api/properties/${property._id}`, {
//       method: "PATCH",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ name }),
//     });

//     refresh();
//   };

//   const changeType = async (t: string) => {
//     await fetch(`/api/properties/${property._id}`, {
//       method: "PATCH",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ type: t }),
//     });

//     refresh();
//   };

//   return (
//     <div className="w-[220px] shrink-0 border-r px-3 py-2 bg-gray-50">
//       <div className="flex items-center justify-between gap-2">
//         <input
//           value={name}
//           onChange={(e) => setName(e.target.value)}
//           onBlur={saveName}
//           className="font-semibold text-sm w-full bg-transparent outline-none"
//         />

//         <PropertyTypePicker value={property.type} onChange={changeType} />
//       </div>
//     </div>
//   );
// }

"use client";

import { useEffect, useState } from "react";

import PropertyTypePicker from "./PropertyTypepicker";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function TableHeaderCell({
  property,
  refresh,
  onPropertyUpdate,
}: {
  property: {
    _id: string;
    name: string;
    type: string;
    formula?: string;
  };
  refresh: () => void;
  onPropertyUpdate?: (propertyId: string, updates: { name?: string; type?: string; formula?: string }) => void;
}) {
  const [name, setName] = useState(property.name);
  const [formula, setFormula] = useState(property.formula || "");

  useEffect(() => {
    setName(property.name);
    setFormula(property.formula || "");
  }, [property.name, property.formula]);

  const saveName = async () => {
    if (!name.trim()) {
      setName(property.name);
      return;
    }

    onPropertyUpdate?.(property._id, { name });

    await fetch(`/api/properties/${property._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    refresh();
  };

  const changeType = async (t: string) => {
    onPropertyUpdate?.(property._id, { type: t });

    await fetch(`/api/properties/${property._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: t }),
    });

    refresh();
  };

  const saveFormula = async () => {
    onPropertyUpdate?.(property._id, { formula });

    await fetch(`/api/properties/${property._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ formula }),
    });

    refresh();
  };

  return (
    <div className="w-[220px] shrink-0 border-r px-3 py-2 bg-muted/40">
      <div className="flex items-center gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={saveName}
          className="border-none shadow-none focus-visible:ring-0 px-0 font-semibold"
        />

        <div className="w-[140px]">
          <PropertyTypePicker value={property.type} onChange={changeType} />
        </div>
      </div>

      {property.type === "formula" && (
        <div className="mt-2 space-y-1">
          <Label className="text-[10px] text-muted-foreground">Formula</Label>
          <Input
            value={formula}
            onChange={(e) => setFormula(e.target.value)}
            onBlur={saveFormula}
            placeholder='IF(status == "Done", "✔", "Pending")'
            className="h-8 text-xs"
            title="Formula"
          />
        </div>
      )}
    </div>
  );
}
