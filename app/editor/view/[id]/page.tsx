"use client";

import { useEffect, useState } from "react";
import EditorComponent from "@/components/notion-editior/EditorComponent";
import "@/styles/editor.css";

export default function EditorPage({ params }: any) {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(`/api/editor/${params.id}`)
      .then((res) => res.json())
      .then((res) => {
        console.log("Fetched:", res);
        setData(res.content); // 👈 IMPORTANT
      });
  }, [params.id]);

  if (!data) return <p>Loading...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">
        Edit Content
      </h1>

      <EditorComponent initialData={data} />
    </div>
  );
}