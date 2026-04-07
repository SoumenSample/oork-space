"use client";

import { useTheme } from "next-themes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TYPES = [
  { type: "text", label: "Text" },
  { type: "number", label: "Number" },
  { type: "select", label: "Select" },
  { type: "multi_select", label: "Multi-select" },
  { type: "date", label: "Date" },
  { type: "person", label: "Person" },
  { type: "files", label: "Files & media" },
  { type: "checkbox", label: "Checkbox" },
  { type: "url", label: "URL" },
  { type: "email", label: "Email" },
  { type: "formula", label: "Formula" },
];

export default function PropertyTypePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (t: string) => void;
}) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={`w-full ${isDark ? "bg-transparent" : ""}`}>
        <SelectValue placeholder="Select type" />
      </SelectTrigger>

      <SelectContent className={`max-h-60 overflow-y-auto ${isDark ? "bg-[#1e1f23] border-gray-700" : "bg-white"}`}>
        {TYPES.map((t) => (
          <SelectItem key={t.type} value={t.type}>
            {t.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}