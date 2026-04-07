"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";
import AddPropertyPicker from "./TodoAddpropertyPicker";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

type Property = {
  _id: string;
  databaseId: string;
  name: string;
  type: string;
  options?: string[];
};

type Task = {
  _id: string;
  databaseId: string;
  title?: string;
  completed?: boolean;
  values: Record<string, any>;
};

export default function TodoTaskModal({
  isOpen,
  onClose,
  databaseId,
  taskId,
  properties,
  onUpdated,
}: {
  isOpen: boolean;
  onClose: () => void;
  databaseId: string;
  taskId: string | null;
  properties: Property[];
  onUpdated: () => void;
}) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [localTitle, setLocalTitle] = useState("");
  const titleDebounceTimer = useRef<NodeJS.Timeout | null>(null);
  const isEditingTitle = useRef(false);

  const [showAddProp, setShowAddProp] = useState(false);

  const titleProp = useMemo(
    () => properties.find((p) => p.type === "title"),
    [properties]
  );

  // Debug logging
  useEffect(() => {
    console.log("TodoTaskModal - titleProp:", titleProp);
    console.log("TodoTaskModal - task:", task);
    console.log("TodoTaskModal - properties:", properties);
    console.log("TodoTaskModal - showAddProp:", showAddProp);
  }, [titleProp, task, properties, showAddProp]);

  // Sync localTitle when task changes (but not while user is typing)
  useEffect(() => {
    if (task && !isEditingTitle.current) {
      const titleValue = task.title || "";
      console.log("Syncing localTitle from task.title:", titleValue);
      setLocalTitle(titleValue);
    }
  }, [task]);

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (titleDebounceTimer.current) {
        clearTimeout(titleDebounceTimer.current);
      }
    };
  }, []);

  const fetchTask = useCallback(async () => {
    if (!taskId) return;

    setLoading(true);
    const res = await fetch(`/api/todo/tasks/${taskId}`);
    const data = await res.json();

    if (!data.values) {
      data.values = {};
    }

    setTask(data);
    setLocalTitle(data.title || "");
    isEditingTitle.current = false;
    setLoading(false);
  }, [taskId]);

  useEffect(() => {
    if (!isOpen) return;
    fetchTask();
  }, [isOpen, fetchTask]);

  const updateValues = async (newValues: any) => {
    if (!task) {
      console.log("updateValues - No task found");
      return;
    }

    console.log("updateValues - Updating task:", task._id);
    console.log("updateValues - New values:", newValues);

    setTask({ ...task, values: newValues || {} });

    try {
      const response = await fetch(`/api/todo/tasks/${task._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values: newValues }),
      });

      if (!response.ok) {
        console.error("updateValues - API error:", response.status, response.statusText);
        const errorData = await response.json().catch(() => ({}));
        console.error("updateValues - Error data:", errorData);
        return;
      }

      const updatedTask = await response.json();
      console.log("updateValues - Successfully updated task:", updatedTask);

      if (!updatedTask.values) {
        updatedTask.values = {};
      }

      setTask(updatedTask);
    } catch (error) {
      console.error("updateValues - Fetch error:", error);
    }
  };

  const setValue = (propId: string, value: any) => {
    console.log("setValue called - propId:", propId, "value:", value);
    console.log("task before setValue:", task);

    if (!task) {
      console.log("No task, returning...");
      return;
    }

    const newValues = {
      ...(task.values || {}),
      [propId]: value,
    };

    console.log("newValues:", newValues);
    updateValues(newValues);
  };

  const normalizeUrl = (value: string) => {
    const v = value.trim();
    if (!v) return "";
    if (v.startsWith("http://") || v.startsWith("https://")) return v;
    return `https://${v}`;
  };

  const filledProps = useMemo(() => {
    if (!task) return [];
    return properties.filter((p) => {
      if (p.type === "title") return false;
      const v = task.values?.[p._id];
      return (
        v !== undefined &&
        v !== null &&
        v !== "" &&
        !(Array.isArray(v) && v.length === 0)
      );
    });
  }, [properties, task]);

  const emptyProps = useMemo(() => {
    if (!task) return [];
    return properties.filter((p) => {
      if (p.type === "title") return false;
      const v = task.values?.[p._id];
      return (
        v === undefined ||
        v === null ||
        v === "" ||
        (Array.isArray(v) && v.length === 0)
      );
    });
  }, [properties, task]);

  const selectClass = `w-full border rounded-md px-3 py-2 text-sm ${
    isDark
      ? "bg-[#18191d] border-gray-700 text-gray-100"
      : "bg-white border-gray-200 text-gray-900"
  }`;

  const renderPropertyInput = (p: Property) => {
    if (!task) return null;
    const v = task.values?.[p._id] ?? (task.values || {})[p._id];

    switch (p.type) {
      case "text":
        return (
          <Input
            value={v || ""}
            onChange={(e) => setValue(p._id, e.target.value)}
            placeholder="Enter text..."
          />
        );

      case "number":
        return (
          <Input
            type="number"
            value={v || ""}
            onChange={(e) => setValue(p._id, e.target.value)}
            placeholder="Enter number..."
          />
        );

      case "date": {
        const dateValue = v ? new Date(v).toISOString().split("T")[0] : "";
        return (
          <Input
            type="date"
            value={dateValue}
            onChange={(e) => setValue(p._id, e.target.value)}
          />
        );
      }

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
            value={v || ""}
            placeholder="email@example.com"
            onChange={(e) => setValue(p._id, e.target.value)}
            onBlur={(e) => {
              const email = e.target.value;
              if (email && email.includes("@")) {
                sendEmail(email);
              }
            }}
          />
        );
      }

      case "checkbox":
        return (
          <div className="flex items-center gap-2">
            <Checkbox
              checked={!!v}
              onCheckedChange={(checked) => setValue(p._id, Boolean(checked))}
            />
            <span className="text-sm text-muted-foreground">Enabled</span>
          </div>
        );

      case "select":
        return (
          <select
            value={v || ""}
            onChange={(e) => setValue(p._id, e.target.value)}
            className={selectClass}
          >
            <option value="">Select...</option>
            {(p.options || []).map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );

      case "multi_select": {
        const multiValues = Array.isArray(v) ? v : [];
        return (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1">
              {multiValues.map((tag: string) => (
                <Badge
                  key={tag}
                  variant="default"
                  className="px-2 py-1 text-xs flex items-center gap-1"
                >
                  {tag}
                  <button
                    onClick={() =>
                      setValue(
                        p._id,
                        multiValues.filter((t) => t !== tag)
                      )
                    }
                    className={isDark ? "hover:text-gray-200" : "hover:text-gray-900"}
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
            <select
              value=""
              onChange={(e) => {
                if (e.target.value && !multiValues.includes(e.target.value)) {
                  setValue(p._id, [...multiValues, e.target.value]);
                }
              }}
              className={selectClass}
            >
              <option value="">Select an option...</option>
              {(p.options || []).map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        );
      }

      case "person":
        return (
          <Input
            value={v || ""}
            onChange={(e) => setValue(p._id, e.target.value)}
            placeholder="Enter name..."
          />
        );

      case "url": {
        const url = v || "";
        return (
          <div className="space-y-2">
            <Input
              type="url"
              value={url}
              onChange={(e) => setValue(p._id, e.target.value)}
              placeholder="https://example.com"
            />
            {url && (
              <a
                href={normalizeUrl(url)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
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
            value={v || ""}
            onChange={(e) => setValue(p._id, e.target.value)}
            placeholder={`Enter ${p.name.toLowerCase()}`}
          />
        );
    }
  };

  const updateTitle = async (newTitle: string) => {
    if (!task) return;

    console.log("updateTitle - Updating task:", task._id, "with title:", newTitle);

    try {
      const response = await fetch(`/api/todo/tasks/${task._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      });

      if (!response.ok) {
        console.error("updateTitle - API error:", response.status, response.statusText);
        return;
      }

      const updatedTask = await response.json();
      console.log("updateTitle - Successfully updated task:", updatedTask);
      setTask(updatedTask);
    } catch (error) {
      console.error("updateTitle - Fetch error:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <Dialog
        open={isOpen}
        onOpenChange={(v) => {
          if (!v) {
            console.log("TodoTaskModal - Modal closing, calling onClose and onUpdated");

            if (titleDebounceTimer.current) {
              clearTimeout(titleDebounceTimer.current);
              console.log("TodoTaskModal - Flushing pending title update");
              if (task) {
                updateTitle(localTitle).then(() => {
                  isEditingTitle.current = false;
                });
              }
            } else {
              isEditingTitle.current = false;
            }

            onClose();
            setTimeout(() => {
              onUpdated();
            }, 100);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle className="text-xl font-semibold">Task Details</DialogTitle>
          </DialogHeader>

          {loading || !task ? (
            <div className={`p-6 text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              Loading...
            </div>
          ) : (
            <>
              {/* TITLE */}
              <div className="px-6">
                <input
                  autoFocus
                  value={localTitle}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    console.log("Title onChange triggered:", newValue);

                    isEditingTitle.current = true;
                    setLocalTitle(newValue);

                    if (titleDebounceTimer.current) {
                      clearTimeout(titleDebounceTimer.current);
                    }

                    titleDebounceTimer.current = setTimeout(() => {
                      console.log("Title debounce - Saving to database:", newValue);
                      updateTitle(newValue).then(() => {
                        isEditingTitle.current = false;
                      });
                    }, 500);
                  }}
                  onBlur={() => {
                    isEditingTitle.current = false;
                  }}
                  placeholder="Untitled"
                  className={`w-full text-3xl font-bold outline-none border-b-2 border-transparent pb-2 bg-transparent transition-colors ${
                    isDark
                      ? "hover:border-gray-700 focus:border-blue-500 text-gray-100"
                      : "hover:border-gray-200 focus:border-blue-500 text-gray-900"
                  }`}
                />
              </div>

              <Separator />

              {/* PROPERTIES */}
              <ScrollArea className="max-h-[60vh]">
                <div className="px-6 py-5 space-y-8">
                  {/* Properties header */}
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold uppercase text-muted-foreground">
                      Properties
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        console.log("Add Property button clicked");
                        setShowAddProp(true);
                      }}
                    >
                      + Add Property
                    </Button>
                  </div>

                  {properties.length === 0 && (
                    <div className="py-10 text-center text-muted-foreground">
                      <div>No properties available yet.</div>
                      <div className="text-sm mt-1">
                        Click + Add Property to create fields for your tasks.
                      </div>
                    </div>
                  )}

                  {/* Filled properties */}
                  {filledProps.length > 0 && (
                    <div className="space-y-5">
                      <div className="text-xs font-semibold uppercase tracking-wide text-primary">
                        Filled Properties
                      </div>

                      {filledProps.map((p) => (
                        <div key={p._id} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Label>{p.name}</Label>
                            <Badge variant="outline" className="text-[10px]">
                              {p.type}
                            </Badge>
                          </div>
                          {renderPropertyInput(p)}
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

                      {emptyProps.map((p) => (
                        <div key={p._id} className="space-y-2 opacity-70">
                          <div className="flex items-center gap-2">
                            <Label className="text-muted-foreground">
                              {p.name}
                            </Label>
                            <Badge variant="outline" className="text-[10px]">
                              {p.type}
                            </Badge>
                          </div>
                          {renderPropertyInput(p)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </ScrollArea>

              <Separator />

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 px-6 py-4">
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Property Modal */}
      {showAddProp && (
        <>
          {console.log("Rendering AddPropertyPicker modal")}
          <AddPropertyPicker
            open={showAddProp}
            properties={properties}
            visiblePropIds={[]}
            databaseId={databaseId}
            onPick={async () => {
              setShowAddProp(false);
              await onUpdated();
            }}
            onPropertyCreated={async () => {
              await onUpdated();
              setShowAddProp(false);
            }}
            onClose={() => setShowAddProp(false)}
          />
        </>
      )}
    </>
  );
}