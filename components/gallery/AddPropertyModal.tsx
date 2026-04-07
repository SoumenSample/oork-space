
// "use client";

// import { useState } from "react";
// import { useTheme } from "next-themes";
// import PropertyTypePicker from "./PropertyTypepicker";

// export default function AddPropertyModal({
//   isOpen,
//   onClose,
//   databaseId,
//   onSaved,
// }: {
//   isOpen: boolean;
//   onClose: () => void;
//   databaseId: string;
//   onSaved: () => void;
// }) {
//   const { resolvedTheme } = useTheme();
//   const isDark = resolvedTheme === "dark";

//   const [name, setName] = useState("");
//   const [type, setType] = useState("text");

//   if (!isOpen) return null;

//   const createProperty = async () => {
//     if (!name.trim()) return;

//     await fetch("/api/properties", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         databaseId,
//         name,
//         type,
//         options: [],
//       }),
//     });

//     setName("");
//     setType("text");
//     onSaved();
//     onClose();
//   };

//   return (
//     <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
//       <div className={`w-full max-w-md rounded-2xl border shadow-xl p-4 ${isDark ? "bg-[#1e1f23] border-gray-700" : "bg-white border-gray-200"}`}>
//         <div className={`font-semibold text-lg ${isDark ? "text-gray-100" : "text-gray-900"}`}>
//           Add property
//         </div>

//         <div className="mt-4 space-y-3">
//           <input
//             className={`w-full border rounded-lg px-3 py-2 outline-none text-sm ${isDark ? "bg-[#18191d] border-gray-700 text-gray-100 placeholder-gray-500 focus:border-gray-500" : "bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-gray-400"}`}
//             placeholder="Property name"
//             value={name}
//             onChange={(e) => setName(e.target.value)}
//           />

//           <PropertyTypePicker value={type} onChange={setType} />

//           <div className="flex gap-2 justify-end pt-2">
//             <button
//               onClick={onClose}
//               className={`px-3 py-2 rounded-lg border text-sm ${isDark ? "border-gray-700 text-gray-300 hover:bg-gray-800" : "border-gray-200 text-gray-700 hover:bg-gray-50"}`}
//             >
//               Cancel
//             </button>

//             <button
//               onClick={createProperty}
//               className={`px-3 py-2 rounded-lg text-sm font-medium ${isDark ? "bg-white text-gray-900 hover:bg-gray-200" : "bg-black text-white hover:bg-gray-800"}`}
//             >
//               Create
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

"use client";

import { useState } from "react";

import PropertyTypePicker from "./PropertyTypepicker";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function AddPropertyModal({
  isOpen,
  onClose,
  databaseId,
  onSaved,
}: {
  isOpen: boolean;
  onClose: () => void;
  databaseId: string;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState("text");
  const [formula, setFormula] = useState("");

  const createProperty = async () => {
    if (!name.trim()) return;
    if (type === "formula" && !formula.trim()) return;

    await fetch("/api/properties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        databaseId,
        name,
        type,
        options: [],
        formula,
      }),
    });

    setName("");
    setType("text");
    setFormula("");
    onSaved();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add property</DialogTitle>
        </DialogHeader>

        <Separator />

        <div className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label>Property name</Label>
            <Input
              placeholder="Property name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Type Picker (your component) */}
          <div className="space-y-2">
            <Label>Type</Label>
            <PropertyTypePicker value={type} onChange={setType} />
          </div>

          {type === "formula" && (
            <div className="space-y-2">
              <Label>Formula</Label>
              <Input
                placeholder='e.g. IF(status == "Done", "✔", "Pending")'
                value={formula}
                onChange={(e) => setFormula(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Supported: IF(condition, trueValue, falseValue), DAYS(endDate, startDate), + - * / and comparisons.
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>

            <Button onClick={createProperty} disabled={!name.trim() || (type === "formula" && !formula.trim())}>
              Create
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
