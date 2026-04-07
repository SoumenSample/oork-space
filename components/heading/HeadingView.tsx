// "use client";

// import { useEffect, useState } from "react";

// type HeadingBlock = {
//   _id: string;
//   databaseId: string;
//   text: string;
//   level: "h1" | "h2" | "h3";
// };

// export default function HeadingView({ databaseId }: { databaseId: string }) {
//   const [headings, setHeadings] = useState<HeadingBlock[]>([]);
//   const [loading, setLoading] = useState(true);

//   const fetchAll = async () => {
//     setLoading(true);
//     const res = await fetch(`/api/heading?databaseId=${databaseId}`);
//     setHeadings(await res.json());
//     setLoading(false);
//   };

//   useEffect(() => {
//     fetchAll();
//   }, [databaseId]);

//   // Seed default heading (Notion style)
//   useEffect(() => {
//     const seed = async () => {
//       const res = await fetch(`/api/heading?databaseId=${databaseId}`);
//       const data = await res.json();

//       if (data.length > 0) return;

//       await fetch("/api/heading", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           databaseId,
//           text: "Heading 1",
//           level: "h1",
//         }),
//       });

//       await fetch("/api/heading", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           databaseId,
//           text: "Heading 2",
//           level: "h2",
//         }),
//       });

//       await fetch("/api/heading", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           databaseId,
//           text: "Heading 3",
//           level: "h3",
//         }),
//       });

//       fetchAll();
//     };

//     seed();
//   }, [databaseId]);

//   const updateHeading = async (id: string, body: any) => {
//     await fetch(`/api/heading/${id}`, {
//       method: "PATCH",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(body),
//     });
//   };

//   const createHeading = async (level: "h1" | "h2" | "h3") => {
//     await fetch("/api/heading", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         databaseId,
//         text: "",
//         level,
//       }),
//     });

//     fetchAll();
//   };

//   const deleteHeading = async (id: string) => {
//     await fetch(`/api/heading/${id}`, { method: "DELETE" });
//     fetchAll();
//   };

//   const getClass = (level: string) => {
//     if (level === "h1") return "text-3xl font-bold";
//     if (level === "h2") return "text-2xl font-bold";
//     return "text-xl font-semibold";
//   };

//   if (loading) return <div className="p-6 text-sm">Loading...</div>;

//   return (
//     <div className="rounded-xl border bg-white overflow-hidden">
//       {/* Header */}
//       <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
//         <div className="font-semibold text-gray-800">Headings</div>

//         <div className="flex gap-2">
//           <button
//             onClick={() => createHeading("h1")}
//             className="text-xs px-3 py-1.5 rounded-lg border hover:bg-gray-100"
//           >
//             + H1
//           </button>
//           <button
//             onClick={() => createHeading("h2")}
//             className="text-xs px-3 py-1.5 rounded-lg border hover:bg-gray-100"
//           >
//             + H2
//           </button>
//           <button
//             onClick={() => createHeading("h3")}
//             className="text-xs px-3 py-1.5 rounded-lg border hover:bg-gray-100"
//           >
//             + H3
//           </button>
//         </div>
//       </div>

//       {/* List */}
//       <div className="p-4 space-y-4">
//         {headings.map((h) => (
//           <div key={h._id} className="group flex items-start gap-3">
//             {/* Dropdown */}
//             <select
//               value={h.level}
//               onChange={(e) => {
//                 const level = e.target.value as "h1" | "h2" | "h3";
//                 setHeadings((prev) =>
//                   prev.map((x) => (x._id === h._id ? { ...x, level } : x))
//                 );
//                 updateHeading(h._id, { level });
//               }}
//               className="text-xs border rounded-md px-2 py-1 bg-white"
//             >
//               <option value="h1">H1</option>
//               <option value="h2">H2</option>
//               <option value="h3">H3</option>
//             </select>

//             {/* Heading input */}
//             <input
//               value={h.text}
//               placeholder="Heading..."
//               onChange={(e) => {
//                 const text = e.target.value;
//                 setHeadings((prev) =>
//                   prev.map((x) => (x._id === h._id ? { ...x, text } : x))
//                 );
//                 updateHeading(h._id, { text });
//               }}
//               className={`flex-1 bg-transparent outline-none text-gray-900 ${getClass(
//                 h.level
//               )}`}
//             />

//             {/* Delete */}
//             <button
//               onClick={() => deleteHeading(h._id)}
//               className="opacity-0 group-hover:opacity-100 transition text-xs px-2 py-1 rounded-md border hover:bg-gray-50"
//             >
//               Delete
//             </button>
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
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { Trash2 } from "lucide-react";

type HeadingBlock = {
  _id: string;
  databaseId: string;
  text: string;
  level: "h1" | "h2" | "h3";
};

export default function HeadingView({ databaseId }: { databaseId: string }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [headings, setHeadings] = useState<HeadingBlock[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    const res = await fetch(`/api/heading?databaseId=${databaseId}`);
    setHeadings(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, [databaseId]);

  // Seed default headings (Notion style)
  useEffect(() => {
    const seed = async () => {
      const res = await fetch(`/api/heading?databaseId=${databaseId}`);
      const data = await res.json();

      if (data.length > 0) return;

      const defaults: Array<{ text: string; level: "h1" | "h2" | "h3" }> = [
        { text: "Heading 1", level: "h1" },
        { text: "Heading 2", level: "h2" },
        { text: "Heading 3", level: "h3" },
      ];

      for (const h of defaults) {
        await fetch("/api/heading", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            databaseId,
            text: h.text,
            level: h.level,
          }),
        });
      }

      fetchAll();
    };

    seed();
  }, [databaseId]);

  const updateHeading = async (id: string, body: any) => {
    await fetch(`/api/heading/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  };

  const createHeading = async (level: "h1" | "h2" | "h3") => {
    const res = await fetch("/api/heading", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        databaseId,
        text: "",
        level,
      }),
    });

    const created = await res.json();
    setHeadings((prev) => [...prev, created]);
  };

  const deleteHeading = async (id: string) => {
    await fetch(`/api/heading/${id}`, { method: "DELETE" });
    setHeadings((prev) => prev.filter((x) => x._id !== id));
  };

  const getHeadingSize = (level: "h1" | "h2" | "h3") => {
    if (level === "h1") return "text-3xl font-bold";
    if (level === "h2") return "text-2xl font-bold";
    return "text-xl font-semibold";
  };

  if (loading) {
    return (
      <div className={`p-6 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
        Loading...
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Card className={`${!isDark ? "bg-gray-100" : ""} rounded-xl border overflow-hidden`}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Headings</CardTitle>

          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => createHeading("h1")}>
              + H1
            </Button>
            <Button size="sm" variant="outline" onClick={() => createHeading("h2")}>
              + H2
            </Button>
            <Button size="sm" variant="outline" onClick={() => createHeading("h3")}>
              + H3
            </Button>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="p-0">
          <ScrollArea className="h-[320px]">
            <div className="p-4 space-y-4">
              {headings.map((h) => (
                <div key={h._id} className={`flex items-start gap-3 border rounded-md px-3 py-2 ${!isDark ? 'bg-rose-50' : ''}`}>
                  {/* Level Select */}
                  <Select
                    value={h.level}
                    onValueChange={(level: "h1" | "h2" | "h3") => {
                      setHeadings((prev) =>
                        prev.map((x) => (x._id === h._id ? { ...x, level } : x))
                      );
                      updateHeading(h._id, { level });
                    }}
                  >
                    <SelectTrigger className={`w-[80px] ${isDark ? "bg-[#18191d]" : ""}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className={isDark ? "bg-[#1e1f23] border-gray-700" : "bg-white"}>
                      <SelectItem value="h1">H1</SelectItem>
                      <SelectItem value="h2">H2</SelectItem>
                      <SelectItem value="h3">H3</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Heading Input */}
                  <Input
                    value={h.text}
                    placeholder="Heading..."
                    onChange={(e) => {
                      const text = e.target.value;
                      setHeadings((prev) =>
                        prev.map((x) => (x._id === h._id ? { ...x, text } : x))
                      );
                      updateHeading(h._id, { text });
                    }}
                    className={`border-none shadow-none focus-visible:ring-0 px-0 ${getHeadingSize(
                      h.level
                    )}`}
                  />

                  {/* Delete */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteHeading(h._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Delete</TooltipContent>
                  </Tooltip>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}