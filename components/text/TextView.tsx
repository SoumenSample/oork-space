// "use client";

// import { useEffect, useState } from "react";

// type TextBlock = {
//   _id: string;
//   databaseId: string;
//   title: string;
//   content: string;
// };

// export default function TextView({ databaseId }: { databaseId: string }) {
//   const [blocks, setBlocks] = useState<TextBlock[]>([]);
//   const [loading, setLoading] = useState(true);

//   const fetchAll = async () => {
//     setLoading(true);
//     const res = await fetch(`/api/text?databaseId=${databaseId}`);
//     const data = await res.json();
//     setBlocks(data);
//     setLoading(false);
//   };

//   useEffect(() => {
//     fetchAll();
//   }, [databaseId]);

//   // Seed default (always show notion like)
//   useEffect(() => {
//     const seed = async () => {
//       const res = await fetch(`/api/text?databaseId=${databaseId}`);
//       const data = await res.json();

//       if (data.length > 0) return;

//       await fetch("/api/text", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           databaseId,
//           title: "Text Page",
//           content:
//             "Welcome 👋\n\nThis is a Notion-style text page.\n\nStart typing here...",
//         }),
//       });

//       fetchAll();
//     };

//     seed();
//   }, [databaseId]);

//   const updateBlock = async (id: string, body: any) => {
//     await fetch(`/api/text/${id}`, {
//       method: "PATCH",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(body),
//     });
//   };

//   const createNewBlock = async () => {
//     await fetch("/api/text", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         databaseId,
//         title: "New Text",
//         content: "",
//       }),
//     });

//     fetchAll();
//   };

//   const deleteBlock = async (id: string) => {
//     await fetch(`/api/text/${id}`, { method: "DELETE" });
//     fetchAll();
//   };

//   if (loading) return <div className="p-6 text-sm">Loading...</div>;

//   return (
//     <div className="rounded-xl border bg-white overflow-hidden">
//       {/* Header */}
//       <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
//         <div className="font-semibold text-gray-800">Text</div>

//         <button
//           onClick={createNewBlock}
//           className="text-sm px-3 py-1.5 rounded-lg bg-black text-white hover:bg-gray-900"
//         >
//           + New
//         </button>
//       </div>

//       {/* Blocks */}
//       <div className="p-4 space-y-6">
//         {blocks.map((b) => (
//           <div key={b._id} className="rounded-xl border p-4 bg-white">
//             {/* Title */}
//             <input
//               value={b.title}
//               onChange={(e) => {
//                 const title = e.target.value;
//                 setBlocks((prev) =>
//                   prev.map((x) => (x._id === b._id ? { ...x, title } : x))
//                 );
//                 updateBlock(b._id, { title });
//               }}
//               className="w-full text-lg font-bold text-gray-900 outline-none bg-transparent"
//             />

//             {/* Content */}
//             <textarea
//               value={b.content}
//               onChange={(e) => {
//                 const content = e.target.value;
//                 setBlocks((prev) =>
//                   prev.map((x) => (x._id === b._id ? { ...x, content } : x))
//                 );
//                 updateBlock(b._id, { content });
//               }}
//               placeholder="Start writing..."
//               className="mt-3 w-full min-h-[180px] text-sm text-gray-700 outline-none bg-transparent resize-none leading-relaxed"
//             />

//             {/* Delete */}
//             <div className="flex justify-end mt-2">
//               <button
//                 onClick={() => deleteBlock(b._id)}
//                 className="text-xs px-3 py-1.5 rounded-lg border hover:bg-gray-50 text-gray-600"
//               >
//                 Delete
//               </button>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }



"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { Plus, Trash2 } from "lucide-react";

type TextBlock = {
  _id: string;
  databaseId: string;
  title: string;
  content: string;
};

export default function TextView({ databaseId }: { databaseId: string }) {
  const { resolvedTheme } = useTheme();
  const [blocks, setBlocks] = useState<TextBlock[]>([]);
  const [loading, setLoading] = useState(true);

  const isDark = resolvedTheme === "dark";

  const fetchAll = async () => {
    setLoading(true);
    const res = await fetch(`/api/text?databaseId=${databaseId}`);
    const data = await res.json();
    setBlocks(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, [databaseId]);

  // Seed default (Notion style)
  useEffect(() => {
    const seed = async () => {
      const res = await fetch(`/api/text?databaseId=${databaseId}`);
      const data = await res.json();

      if (data.length > 0) return;

      await fetch("/api/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          databaseId,
          title: "Text Page",
          content:
            "Welcome 👋\n\nThis is a Notion-style text page.\n\nStart typing here...",
        }),
      });

      fetchAll();
    };

    seed();
  }, [databaseId]);

  const updateBlock = async (id: string, body: any) => {
    await fetch(`/api/text/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  };

  const createNewBlock = async () => {
    const res = await fetch("/api/text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        databaseId,
        title: "New Text",
        content: "",
      }),
    });

    const created = await res.json();
    setBlocks((prev) => [...prev, created]);
  };

  const deleteBlock = async (id: string) => {
    await fetch(`/api/text/${id}`, { method: "DELETE" });
    setBlocks((prev) => prev.filter((x) => x._id !== id));
  };

  if (loading) return <div className="p-6 text-sm">Loading...</div>;

  return (
    <TooltipProvider>
      <Card className={`${!isDark ? "bg-gray-50" : "bg-transparent"} rounded-xl border overflow-hidden`}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Text</CardTitle>

          <Button onClick={createNewBlock} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New
          </Button>
        </CardHeader>

        <Separator />

        <CardContent className="p-0">
          <ScrollArea className="h-[520px]">
            <div className="p-4 space-y-6">
              {blocks.map((b) => (
                <Card key={b._id} className={!isDark ? 'bg-rose-50' : 'bg-transparent'}>
                  <CardContent className="space-y-3 p-4">
                    {/* Title */}
                    <Input
                      value={b.title}
                      onChange={(e) => {
                        const title = e.target.value;
                        setBlocks((prev) =>
                          prev.map((x) =>
                            x._id === b._id ? { ...x, title } : x
                          )
                        );
                        updateBlock(b._id, { title });
                      }}
                      className="text-lg font-semibold border-none shadow-none focus-visible:ring-0 px-0"
                    />

                    {/* Content */}
                    <Textarea
                      value={b.content}
                      onChange={(e) => {
                        const content = e.target.value;
                        setBlocks((prev) =>
                          prev.map((x) =>
                            x._id === b._id ? { ...x, content } : x
                          )
                        );
                        updateBlock(b._id, { content });
                      }}
                      placeholder="Start writing..."
                      className="min-h-[180px] resize-none border-none shadow-none focus-visible:ring-0 px-0 leading-relaxed"
                    />

                    {/* Delete */}
                    <div className="flex justify-end">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteBlock(b._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete</TooltipContent>
                      </Tooltip>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {blocks.length === 0 && (
                <div className="text-sm text-muted-foreground px-2 py-6">
                  No text blocks yet.
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
