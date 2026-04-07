"use client";

import { useState } from "react";
import PropertyTypePicker from "./PropertyTypePicker";

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
  const [optionsText, setOptionsText] = useState("");
  const [formula, setFormula] = useState("");

  if (!isOpen) return null;

  const createProperty = async () => {
    if (!name.trim()) return;

    const options =
      type === "select" || type === "multi_select"
        ? optionsText
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean)
        : [];

    await fetch("/api/properties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        databaseId,
        name,
        type,
        options,
        formula: type === "formula" ? formula : undefined,
      }),
    });

    setName("");
    setType("text");
    setOptionsText("");
    setFormula("");
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-2xl border shadow-xl p-4">
        <div className="font-semibold text-lg">Add property</div>

        <div className="mt-4 space-y-3">
          <input
            className="w-full border rounded-lg px-3 py-2 outline-none"
            placeholder="Property name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <PropertyTypePicker value={type} onChange={setType} />

          {(type === "select" || type === "multi_select") && (
            <input
              className="w-full border rounded-lg px-3 py-2 outline-none"
              placeholder="Options (comma separated)"
              value={optionsText}
              onChange={(e) => setOptionsText(e.target.value)}
            />
          )}

          {type === "formula" && (
            <div>
              <textarea
                className="w-full border rounded-lg px-3 py-2 outline-none resize-none h-24"
                placeholder="Enter formula (e.g., columnA + columnB)"
                value={formula}
                onChange={(e) => setFormula(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Formula properties are read-only and auto-calculated
              </p>
            </div>
          )}

          <div className="flex gap-2 justify-end pt-2">
            <button
              onClick={onClose}
              className="px-3 py-2 rounded-lg border text-sm"
            >
              Cancel
            </button>

            <button
              onClick={createProperty}
              className="px-3 py-2 rounded-lg bg-black text-white text-sm"
            >
              Create
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
