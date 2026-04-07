"use client";

import { useEffect, useMemo, useState } from "react";

import AddPropertyModal from "./AddPropertyModal";

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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Property = {
  _id: string;
  databaseId: string;
  name: string;
  type: string;
  options?: Array<{ label: string; color: string }>;
};

type Item = {
  _id: string;
  databaseId: string;
  title?: string;
  values: Record<string, any>;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  item: Item;
  databaseId: string;
  properties: Property[];
  onSaved: () => void;
};

export default function GalleryItemModal({
  isOpen,
  onClose,
  item,
  databaseId,
  properties,
  onSaved,
}: Props) {
  const [title, setTitle] = useState(item.title || "Untitled");
  const [values, setValues] = useState<Record<string, any>>(item.values || {});
  const [saving, setSaving] = useState(false);
  const [showAddProperty, setShowAddProperty] = useState(false);

  useEffect(() => {
    setTitle(item.title || "Untitled");
    setValues(item.values || {});
  }, [item]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/items/${item._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, values }),
      });

      if (!response.ok) {
        alert("Failed to save changes");
        return;
      }

      onSaved();
      onClose();
    } catch (error) {
      console.error("Save failed:", error);
      alert("Error saving changes");
    } finally {
      setSaving(false);
    }
  };

  const handleValueChange = (propertyId: string, value: any) => {
    setValues((prev) => ({ ...prev, [propertyId]: value }));
  };
  const normalizeUrl = (value: string) => {
  const v = value.trim();
  if (!v) return "";

  // if already has http/https
  if (v.startsWith("http://") || v.startsWith("https://")) return v;

  // otherwise add https
  return `https://${v}`;
};


  const filledProps = useMemo(() => {
    return properties.filter((p) => {
      const v = values[p._id];
      return (
        v !== undefined &&
        v !== null &&
        v !== "" &&
        !(Array.isArray(v) && v.length === 0)
      );
    });
  }, [properties, values]);

  const emptyProps = useMemo(() => {
    return properties.filter((p) => {
      const v = values[p._id];
      return (
        v === undefined ||
        v === null ||
        v === "" ||
        (Array.isArray(v) && v.length === 0)
      );
    });
  }, [properties, values]);

  const renderPropertyInput = (prop: Property) => {
    const currentValue = values[prop._id];

    switch (prop.type) {
      case "text":
        return (
          <Input
            value={currentValue || ""}
            onChange={(e) => handleValueChange(prop._id, e.target.value)}
            placeholder={`Enter ${prop.name.toLowerCase()}`}
          />
        );

      case "email": {
  const sendEmail = async (email: string) => {
    try {
      await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
    } catch (err) {
      console.error("Email send failed", err);
    }
  };

  return (
    <Input
      type="email"
      value={currentValue || ""}
      placeholder="email@example.com"
      onChange={(e) => handleValueChange(prop._id, e.target.value)}
      onBlur={(e) => {
        const email = e.target.value;

        // basic validation
        if (email && email.includes("@")) {
          sendEmail(email); // ✅ API call
        }
      }}
    />
  );
}

      case "phone":
        return (
          <Input
            type="tel"
            value={currentValue || ""}
            onChange={(e) => handleValueChange(prop._id, e.target.value)}
            placeholder="+1 (555) 000-0000"
          />
        );

      case "number":
        return (
          <Input
            type="number"
            value={currentValue || ""}
            onChange={(e) => handleValueChange(prop._id, e.target.value)}
            placeholder={`Enter ${prop.name.toLowerCase()}`}
          />
        );

      case "date": {
        const dateValue = currentValue
          ? new Date(currentValue).toISOString().split("T")[0]
          : "";

        return (
          <Input
            type="date"
            value={dateValue}
            onChange={(e) => handleValueChange(prop._id, e.target.value)}
          />
        );
      }

      case "checkbox":
        return (
          <div className="flex items-center gap-2">
            <Checkbox
              checked={!!currentValue}
              onCheckedChange={(checked) =>
                handleValueChange(prop._id, Boolean(checked))
              }
            />
            <span className="text-sm text-muted-foreground">Enabled</span>
          </div>
        );

      case "select":
      case "status":
        return (
          <Select
            value={currentValue || ""}
            onValueChange={(val) => handleValueChange(prop._id, val)}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Select ${prop.name.toLowerCase()}`} />
            </SelectTrigger>

            <SelectContent>
              {(prop.options || []).map((opt) => (
                <SelectItem key={opt.label} value={opt.label}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "multi_select": {
        const multiValues = Array.isArray(currentValue) ? currentValue : [];

        return (
          <div className="space-y-2">
            {(prop.options || []).map((opt) => {
              const checked = multiValues.includes(opt.label);

              return (
                <label
                  key={opt.label}
                  className="flex items-center gap-2 text-sm"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(isChecked) => {
                      const bool = Boolean(isChecked);

                      const newValues = bool
                        ? [...multiValues, opt.label]
                        : multiValues.filter((v) => v !== opt.label);

                      handleValueChange(prop._id, newValues);
                    }}
                  />
                  <span>{opt.label}</span>
                </label>
              );
            })}
          </div>
        );
      }
      case "files": {
  const files = Array.isArray(currentValue) ? currentValue : [];

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const uploaded = await res.json();

    // Save into values
    handleValueChange(prop._id, [
      ...files,
      {
        name: uploaded.name,
        url: uploaded.url,
        type: uploaded.type,
      },
    ]);
  };

  const removeFile = (url: string) => {
    handleValueChange(
      prop._id,
      files.filter((f: any) => f.url !== url)
    );
  };

  return (
    <div className="space-y-3">
      {/* Upload button */}
      <label className="inline-flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer hover:bg-gray-50 text-sm">
        📎 Upload file
        <input
          type="file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) uploadFile(file);
          }}
        />
      </label>

      {/* Preview list */}
      <div className="space-y-2">
        {files.map((f: any) => (
          <div
            key={f.url}
            className="flex items-center justify-between gap-3 border rounded-md px-3 py-2"
          >
            <a
              href={f.url}
              target="_blank"
              className="text-sm text-blue-600 hover:underline truncate"
            >
              {f.name}
            </a>

            <button
              onClick={() => removeFile(f.url)}
              className="text-xs px-2 py-1 rounded-md border hover:bg-gray-50"
            >
              Remove
            </button>
          </div>
        ))}

        {files.length === 0 && (
          <div className="text-sm text-gray-400">No files uploaded</div>
        )}
      </div>
    </div>
  );
}
case "url": {
  const url = currentValue || "";

  return (
    <div className="space-y-2">
      <Input
        type="url"
        value={url}
        onChange={(e) => handleValueChange(prop._id, e.target.value)}
        placeholder="https://example.com"
      />

      {url && (
        <a
          href={normalizeUrl(url)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Open link
        </a>
      )}
    </div>
  );
}



      default:
        return (
          <Input
            value={currentValue || ""}
            onChange={(e) => handleValueChange(prop._id, e.target.value)}
            placeholder={`Enter ${prop.name.toLowerCase()}`}
          />
        );
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden">
          {/* Header */}
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle className="space-y-2">
              <div className="text-xs text-muted-foreground">TITLE</div>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-2xl font-bold border-none shadow-none focus-visible:ring-0 px-0"
                placeholder="Untitled"
              />
            </DialogTitle>
          </DialogHeader>

          <Separator />

          {/* Body */}
          <ScrollArea className="max-h-[65vh]">
            <div className="px-6 py-5 space-y-8">
              {/* Properties header */}
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold uppercase text-muted-foreground">
                  Properties
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddProperty(true)}
                >
                  + Add Property
                </Button>
              </div>

              {properties.length === 0 && (
                <div className="py-10 text-center text-muted-foreground">
                  <div>No properties available yet.</div>
                  <div className="text-sm mt-1">
                    Click “+ Add Property” to create fields for your cards.
                  </div>
                </div>
              )}

              {/* Filled properties */}
              {filledProps.length > 0 && (
                <div className="space-y-5">
                  <div className="text-xs font-semibold uppercase tracking-wide text-primary">
                    Filled Properties
                  </div>

                  {filledProps.map((prop) => (
                    <div key={prop._id} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label>{prop.name}</Label>
                        <Badge variant="secondary" className="text-[10px]">
                          {prop.type}
                        </Badge>
                      </div>
                      {renderPropertyInput(prop)}
                    </div>
                  ))}
                </div>
              )}

              {/* Empty properties */}
              {emptyProps.length > 0 && (
                <div className="space-y-5">
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Empty Properties
                  </div>

                  {emptyProps.map((prop) => (
                    <div key={prop._id} className="space-y-2 opacity-70">
                      <div className="flex items-center gap-2">
                        <Label className="text-muted-foreground">
                          {prop.name}
                        </Label>
                        <Badge variant="outline" className="text-[10px]">
                          {prop.type}
                        </Badge>
                      </div>
                      {renderPropertyInput(prop)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>

          <Separator />

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-6 py-4 bg-muted/30">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>

            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Property Modal */}
      {showAddProperty && (
        <AddPropertyModal
          isOpen={showAddProperty}
          onClose={() => setShowAddProperty(false)}
          databaseId={databaseId}
          onSaved={() => {
            setShowAddProperty(false);
            onSaved();
          }}
        />
      )}
    </>
  );
}
