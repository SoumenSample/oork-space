// "use client";

// import { useEffect, useRef, useState } from "react";

// type NumberItem = {
//   _id: string;
//   databaseId: string;
//   text: string;
//   order: number;
// };

// export default function NumberListView({ databaseId }: { databaseId: string }) {
//   const [items, setItems] = useState<NumberItem[]>([]);
//   const [loading, setLoading] = useState(true);

//   // store refs for focus (Notion style)
//   const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

//   const fetchAll = async () => {
//     setLoading(true);
//     const res = await fetch(`/api/numberlist?databaseId=${databaseId}`);
//     setItems(await res.json());
//     setLoading(false);
//   };

//   // Seed default only once
//   useEffect(() => {
//     const seed = async () => {
//       const res = await fetch(`/api/numberlist?databaseId=${databaseId}`);
//       const data = await res.json();

//       if (data.length > 0) return;

//       const defaults = [
//         "This is a numbered list",
//         "Press Enter to add a new line",
//         "Backspace on empty line deletes it",
//       ];

//       for (const text of defaults) {
//         await fetch("/api/numberlist", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ databaseId, text }),
//         });
//       }

//       fetchAll();
//     };

//     seed();
//   }, [databaseId]);

//   useEffect(() => {
//     fetchAll();
//   }, [databaseId]);

//   const updateItem = async (id: string, body: any) => {
//     await fetch(`/api/numberlist/${id}`, {
//       method: "PATCH",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(body),
//     });
//   };

//   const createItem = async (text = "", focusAfter = true) => {
//     const res = await fetch("/api/numberlist", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ databaseId, text }),
//     });

//     const created = await res.json();

//     setItems((prev) => [...prev, created]);

//     if (focusAfter) {
//       setTimeout(() => {
//         inputRefs.current[created._id]?.focus();
//       }, 50);
//     }
//   };

//   const deleteItem = async (id: string) => {
//     await fetch(`/api/numberlist/${id}`, { method: "DELETE" });
//     setItems((prev) => prev.filter((x) => x._id !== id));
//   };

//   const handleEnter = async (currentId: string) => {
//     await createItem("", true);
//   };

//   const handleBackspace = async (it: NumberItem) => {
//     if (it.text.trim() !== "") return;

//     // delete this line
//     await deleteItem(it._id);

//     // focus previous
//     const idx = items.findIndex((x) => x._id === it._id);
//     const prev = items[idx - 1];

//     if (prev) {
//       setTimeout(() => {
//         inputRefs.current[prev._id]?.focus();
//       }, 50);
//     }
//   };

//   if (loading) return <div className="p-6 text-sm">Loading...</div>;

//   return (
//     <div className="rounded-xl border bg-white overflow-hidden">
//       {/* Header */}
//       <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
//         <div className="font-semibold text-gray-800">Numbered list</div>

//         <button
//           onClick={() => createItem("New item")}
//           className="text-sm px-3 py-1.5 rounded-lg bg-black text-white hover:bg-gray-900"
//         >
//           + New
//         </button>
//       </div>

//       {/* List */}
//       <div className="p-4 space-y-2">
//         {items.map((it, index) => (
//           <div
//             key={it._id}
//             className="group flex items-start gap-3 px-2 py-2 rounded-lg hover:bg-gray-50"
//           >
//             {/* Number */}
//             <div className="text-sm text-gray-500 w-6 text-right pt-[2px]">
//               {index + 1}.
//             </div>

//             {/* Text */}
//             <input
//               ref={(el) => {
//                 inputRefs.current[it._id] = el;
//               }}
//               value={it.text}
//               placeholder="List item..."
//               onChange={(e) => {
//                 const text = e.target.value;

//                 // fast UI update
//                 setItems((prev) =>
//                   prev.map((x) => (x._id === it._id ? { ...x, text } : x))
//                 );

//                 updateItem(it._id, { text });
//               }}
//               onKeyDown={(e) => {
//                 if (e.key === "Enter") {
//                   e.preventDefault();
//                   handleEnter(it._id);
//                 }

//                 if (e.key === "Backspace") {
//                   handleBackspace(it);
//                 }
//               }}
//               className="flex-1 bg-transparent outline-none text-sm font-medium text-gray-800"
//             />

//             {/* Delete button */}
//             <button
//               onClick={() => deleteItem(it._id)}
//               className="opacity-0 group-hover:opacity-100 transition text-xs px-2 py-1 rounded-md border hover:bg-gray-100"
//             >
//               Delete
//             </button>
//           </div>
//         ))}

//         {items.length === 0 && (
//           <div className="text-sm text-gray-400 px-2 py-6">
//             No list items yet.
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }



"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { Plus, Trash2 } from "lucide-react";

type NumberItem = {
  _id: string;
  databaseId: string;
  text: string;
  order: number;
};

export default function NumberListView({ databaseId }: { databaseId: string }) {
  const { resolvedTheme } = useTheme();
  const [items, setItems] = useState<NumberItem[]>([]);
  const [loading, setLoading] = useState(true);

  // store refs for focus (Notion style)
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const isDark = resolvedTheme === "dark";

  const fetchAll = async () => {
    setLoading(true);
    const res = await fetch(`/api/numberlist?databaseId=${databaseId}`);
    setItems(await res.json());
    setLoading(false);
  };

  // Seed default only once
  useEffect(() => {
    const seed = async () => {
      const res = await fetch(`/api/numberlist?databaseId=${databaseId}`);
      const data = await res.json();

      if (data.length > 0) return;

      const defaults = [
        "This is a numbered list",
        "Press Enter to add a new line",
        "Backspace on empty line deletes it",
      ];

      for (const text of defaults) {
        await fetch("/api/numberlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ databaseId, text }),
        });
      }

      fetchAll();
    };

    seed();
  }, [databaseId]);

  useEffect(() => {
    fetchAll();
  }, [databaseId]);

  const updateItem = async (id: string, body: any) => {
    await fetch(`/api/numberlist/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  };

  const createItem = async (text = "", focusAfter = true) => {
    const res = await fetch("/api/numberlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ databaseId, text }),
    });

    const created = await res.json();

    setItems((prev) => [...prev, created]);

    if (focusAfter) {
      setTimeout(() => {
        inputRefs.current[created._id]?.focus();
      }, 50);
    }
  };

  const deleteItem = async (id: string) => {
    await fetch(`/api/numberlist/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((x) => x._id !== id));
  };

  const handleEnter = async () => {
    await createItem("", true);
  };

  const handleBackspace = async (it: NumberItem) => {
    if (it.text.trim() !== "") return;

    const idx = items.findIndex((x) => x._id === it._id);

    await deleteItem(it._id);

    const prev = items[idx - 1];
    if (prev) {
      setTimeout(() => {
        inputRefs.current[prev._id]?.focus();
      }, 50);
    }
  };

  if (loading) return <div className="p-6 text-sm">Loading...</div>;

  return (
    <TooltipProvider>
      <Card className={`${!isDark ? "bg-gray-100" : "bg-transparent"} rounded-xl border overflow-hidden`}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Numbered list</CardTitle>

          <Button onClick={() => createItem("New item")} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New
          </Button>
        </CardHeader>

        <Separator />

        <CardContent className="p-0">
          <ScrollArea className="h-[320px]">
            <div className="p-4 space-y-2">
              {items.map((it, index) => (
                <div key={it._id} className={`flex items-center gap-3 border rounded-md px-2 py-2 ${!isDark ? 'bg-rose-50' : ''}`}>
                  {/* Number */}
                  <div className="w-8 text-right text-sm text-muted-foreground">
                    {index + 1}.
                  </div>

                  {/* Text */}
                  <Input
                    ref={(el) => {
                      inputRefs.current[it._id] = el;
                    }}
                    value={it.text}
                    placeholder="List item..."
                    onChange={(e) => {
                      const text = e.target.value;

                      setItems((prev) =>
                        prev.map((x) => (x._id === it._id ? { ...x, text } : x))
                      );

                      updateItem(it._id, { text });
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleEnter();
                      }

                      if (e.key === "Backspace") {
                        handleBackspace(it);
                      }
                    }}
                    className="border-none shadow-none focus-visible:ring-0 px-0"
                  />

                  {/* Delete */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteItem(it._id)}
                        className="opacity-70 hover:opacity-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Delete</TooltipContent>
                  </Tooltip>
                </div>
              ))}

              {items.length === 0 && (
                <div className="text-sm text-muted-foreground px-2 py-6">
                  No list items yet.
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
