"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

type Property = {
  _id: string;
  name: string;
  type: string;
};

const PROPERTY_TYPES = [
  { type: "text", label: "Text", icon: "T" },
  { type: "number", label: "Number", icon: "#" },
  { type: "select", label: "Select", icon: "▼" },
  { type: "multi_select", label: "Multi-select", icon: "☰" },
  { type: "date", label: "Date", icon: "📅" },
  { type: "checkbox", label: "Checkbox", icon: "☑" },
  { type: "url", label: "URL", icon: "🔗" },
  { type: "email", label: "Email", icon: "✉" },
  { type: "person", label: "Person", icon: "👤" },
  { type: "files", label: "Files & Media", icon: "📁" },
  { type: "formula", label: "Formula", icon: "∑" },
];

export default function AddPropertyPicker({
  properties,
  visiblePropIds,
  databaseId,
  onPick,
  onPropertyCreated,
  onClose,
  open,
}: {
  properties: Property[];
  visiblePropIds: string[];
  databaseId: string;
  onPick: (propId: string) => void;
  onPropertyCreated: () => void;
  onClose: () => void;
  open: boolean;
}) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [creating, setCreating] = useState(false);

  const createAndAddProperty = async (type: string, label: string) => {
    setCreating(true);

    const options =
      type === "select"
        ? ["Not started", "In progress", "Done"]
        : type === "multi_select"
        ? ["Work", "Personal", "Important"]
        : [];

    try {
      const res = await fetch("/api/todo/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          databaseId,
          name: label,
          type,
          options,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(`Failed: ${error.error || "Unknown error"}`);
        setCreating(false);
        return;
      }

      setCreating(false);
      await onPropertyCreated();
      onClose();
    } catch {
      alert("Failed to create property");
      setCreating(false);
    }
  };

  const hiddenProps = properties.filter(
    (p) => p.type !== "title" && !visiblePropIds.includes(p._id)
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DialogContent className="max-w-md p-0">
        <DialogHeader className="px-4 py-3 border-b">
          <DialogTitle className="text-sm">
            Add a property
          </DialogTitle>
          <DialogDescription className="text-xs">
            Click a type to create a new property
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[400px]">
          {/* Existing Properties */}
          {hiddenProps.length > 0 && (
            <>
              <div className={`px-4 py-2 text-xs font-semibold ${isDark ? "text-gray-400 bg-[#18191d]" : "text-muted-foreground bg-muted"}`}>
                EXISTING PROPERTIES
              </div>

              {hiddenProps.map((p) => (
                <button
                  key={p._id}
                  onClick={() => onPick(p._id)}
                  className={`w-full px-4 py-2.5 text-left text-sm flex items-center justify-between border-b ${
                    isDark 
                      ? "hover:bg-gray-800 border-gray-700" 
                      : "hover:bg-muted border-gray-200"
                  }`}
                >
                  <span className="font-medium">{p.name}</span>
                  <span className="text-xs text-muted-foreground capitalize">
                    {p.type.replace("_", " ")}
                  </span>
                </button>
              ))}
            </>
          )}

          {/* Create New */}
          <div className={`px-4 py-2 text-xs font-semibold ${isDark ? "text-gray-400 bg-[#18191d]" : "text-muted-foreground bg-muted"}`}>
            CREATE NEW PROPERTY
          </div>

          {PROPERTY_TYPES.map(({ type, label, icon }) => (
            <button
              key={type}
              onClick={() => createAndAddProperty(type, label)}
              disabled={creating}
              className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 border-b disabled:opacity-50 ${
                isDark 
                  ? "hover:bg-blue-900/30 border-gray-700" 
                  : "hover:bg-blue-50 border-gray-200"
              }`}
            >
              <span className="w-6 text-center">{icon}</span>
              <span className="flex-1 font-medium">{label}</span>
              <span className="text-xs text-muted-foreground">
                Click to add
              </span>
            </button>
          ))}
        </ScrollArea>

        <div className="px-4 py-3 border-t flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}