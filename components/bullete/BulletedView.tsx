// "use client";

// import { useEffect, useRef, useState } from "react";

// type BulletItem = {
//   _id: string;
//   databaseId: string;
//   text: string;
//   order: number;
// };

// export default function BulletedListView({
//   databaseId,
// }: {
//   databaseId: string;
// }) {
//   const [items, setItems] = useState<BulletItem[]>([]);
//   const [loading, setLoading] = useState(true);

//   const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

//   const fetchAll = async () => {
//     setLoading(true);
//     const res = await fetch(`/api/bullets?databaseId=${databaseId}`);
//     setItems(await res.json());
//     setLoading(false);
//   };

//   // seed defaults only once
//   useEffect(() => {
//     const seed = async () => {
//       const res = await fetch(`/api/bullets?databaseId=${databaseId}`);
//       const data = await res.json();

//       if (data.length > 0) return;

//       const defaults = [
//         "This is a bulleted list",
//         "Press Enter to add a new bullet",
//         "Backspace on empty bullet deletes it",
//       ];

//       for (const text of defaults) {
//         await fetch("/api/bullets", {
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
//     await fetch(`/api/bullets/${id}`, {
//       method: "PATCH",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(body),
//     });
//   };

//   const createItem = async (text = "", focusAfter = true) => {
//     const res = await fetch("/api/bullets", {
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
//     await fetch(`/api/bullets/${id}`, { method: "DELETE" });
//     setItems((prev) => prev.filter((x) => x._id !== id));
//   };

//   const handleEnter = async () => {
//     await createItem("", true);
//   };

//   const handleBackspace = async (it: BulletItem) => {
//     if (it.text.trim() !== "") return;

//     const idx = items.findIndex((x) => x._id === it._id);

//     await deleteItem(it._id);

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
//         <div className="font-semibold text-gray-800">Bulleted list</div>

//         <button
//           onClick={() => createItem("New bullet")}
//           className="text-sm px-3 py-1.5 rounded-lg bg-black text-white hover:bg-gray-900"
//         >
//           + New
//         </button>
//       </div>

//       {/* List */}
//       <div className="p-4 space-y-2">
//         {items.map((it) => (
//           <div
//             key={it._id}
//             className="group flex items-start gap-3 px-2 py-2 rounded-lg hover:bg-gray-50"
//           >
//             {/* Bullet dot */}
//             <div className="w-5 flex justify-center pt-[6px]">
//               <div className="w-1.5 h-1.5 rounded-full bg-gray-700" />
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

//                 setItems((prev) =>
//                   prev.map((x) => (x._id === it._id ? { ...x, text } : x))
//                 );

//                 updateItem(it._id, { text });
//               }}
//               onKeyDown={(e) => {
//                 if (e.key === "Enter") {
//                   e.preventDefault();
//                   handleEnter();
//                 }

//                 if (e.key === "Backspace") {
//                   handleBackspace(it);
//                 }
//               }}
//               className="flex-1 bg-transparent outline-none text-sm font-medium text-gray-800"
//             />

//             {/* Delete */}
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
//             No bullets yet.
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }



"use client";

import { useEffect, useRef, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";

import { Trash2, Plus } from "lucide-react";

type BulletItem = {
  _id: string;
  databaseId: string;
  text: string;
  order: number;
};

export default function BulletedListView({
  databaseId,
}: {
  databaseId: string;
}) {
  const [items, setItems] = useState<BulletItem[]>([]);
  const [loading, setLoading] = useState(true);

  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const fetchAll = async () => {
    setLoading(true);
    const res = await fetch(`/api/bullets?databaseId=${databaseId}`);
    setItems(await res.json());
    setLoading(false);
  };

  // seed defaults only once
  useEffect(() => {
    const seed = async () => {
      const res = await fetch(`/api/bullets?databaseId=${databaseId}`);
      const data = await res.json();

      if (data.length > 0) return;

      const defaults = [
        "This is a bulleted list",
        "Press Enter to add a new bullet",
        "Backspace on empty bullet deletes it",
      ];

      for (const text of defaults) {
        await fetch("/api/bullets", {
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
    await fetch(`/api/bullets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  };

  const createItem = async (text = "", focusAfter = true) => {
    const res = await fetch("/api/bullets", {
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
    await fetch(`/api/bullets/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((x) => x._id !== id));
  };

  const handleEnter = async () => {
    await createItem("", true);
  };

  const handleBackspace = async (it: BulletItem) => {
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
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Bulleted list</CardTitle>

          <Button onClick={() => createItem("New bullet")} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New
          </Button>
        </CardHeader>

        <Separator />

        <CardContent className="p-0">
          <ScrollArea className="h-[320px]">
            <div className="p-4 space-y-2">
              {items.map((it) => (
                <div
                  key={it._id}
                  className="flex items-center gap-3 border rounded-md px-2 py-2"
                >
                  {/* Bullet dot */}
                  <div className="w-5 flex justify-center">
                    <div className="h-1.5 w-1.5 rounded-full bg-foreground/70" />
                  </div>

                  {/* Input */}
                  <Input
                    ref={(el) => {
                      inputRefs.current[it._id] = el;
                    }}
                    value={it.text}
                    placeholder="List item..."
                    onChange={(e) => {
                      const text = e.target.value;

                      setItems((prev) =>
                        prev.map((x) =>
                          x._id === it._id ? { ...x, text } : x
                        )
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
                  No bullets yet.
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
