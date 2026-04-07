"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import EditorComponent from "@/components/notion-editior/EditorComponent";
import "@/styles/editor.css";

export default function EditPage() {
  const params = useParams();
  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const [data, setData] = useState<any>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    if (!id) {
      setHasLoaded(true);
      return;
    }

    // Fetch existing data on mount
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/editor/${id}`);
        if (res.ok) {
          const result = await res.json();
          console.log("Fetched:", result);
          if (result?.content) {
            setData(result.content);
          }
        }
      } catch (err) {
        console.error("Error fetching editor data:", err);
      } finally {
        setHasLoaded(true);
      }
    };

    fetchData();
  }, [id]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Editor</h1>
      {hasLoaded && <EditorComponent initialData={data} docId={id} />}
    </div>
  );
}