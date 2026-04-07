"use client";

const TYPES = [
  { label: "Text", value: "text" },
  { label: "Number", value: "number" },
  { label: "Select", value: "select" },
  { label: "Multi Select", value: "multi_select" },
  { label: "Date", value: "date" },
  { label: "Checkbox", value: "checkbox" },
  { label: "URL", value: "url" },
  { label: "Email", value: "email" },
  { label: "Phone", value: "phone" },
  { label: "Person", value: "person" },
  { label: "Formula", value: "formula" },
];

export default function PropertyTypePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border rounded-lg px-3 py-2 bg-white outline-none"
      aria-label="Property type"
    >
      {TYPES.map((t) => (
        <option key={t.value} value={t.value}>
          {t.label}
        </option>
      ))}
    </select>
  );
}
