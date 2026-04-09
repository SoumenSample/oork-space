"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import "@/styles/editor.css";
import EditorJS, { type OutputData, type ToolConstructable } from "@editorjs/editorjs";

import Header from "@editorjs/header";
import List from "@editorjs/list";
import Table from "@editorjs/table";
import Delimiter from "@editorjs/delimiter";
import Quote from "@editorjs/quote";
import CalloutTool from "./CallutTools";
import ToggleTool from "./ToggleTolls";
import PageLinkTool from "./pageLink";
import TimelineBlockTool from "./TimelineBlockTool";
import BoardBlockTool from "./BoardBlockTool";
import TableBlockTool from "./TableBlockTool";
import ChartBlockTool from "./ChartBlockTool";
import DocumentBlockTool from "./DocumentBlockTool";
import Image from "next/image";
import type { StaticImageData } from "next/image";
import textPreview from "../../public/0Jl54.png";
import headerPreview from "../../public/c956c7564a558bd2e5f09c5a76352d17.jpg";
import linkPreview from "@/public/uploads/1771517084456-Screenshot-(2).png";

type PreviewState = {
  visible: boolean;
  top: number;
  left: number;
  title: string;
  description: string;
  url: StaticImageData;
};

type EditorComponentProps = {
  initialData?: unknown;
  docId?: string;
  databaseId?: string;
  projectId?: string;
};

export default function EditorComponent({ initialData, docId, databaseId, projectId }: EditorComponentProps) {
  const editorRef = useRef<EditorJS | null>(null);
  const initialDataRef = useRef<OutputData | undefined>(initialData as OutputData | undefined);
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const holderId = useId().replace(/:/g, "_");
  const [currentDocId, setCurrentDocId] = useState<string | undefined>(docId);
  const [isLoading, setIsLoading] = useState(!docId && !!databaseId);
  const [saveStatus, setSaveStatus] = useState<string>("");
  const [preview, setPreview] = useState<PreviewState>({
    visible: false,
    top: 0,
    left: 0,
    title: "",
    description: "",
    url: textPreview,
  });

  const handleSave = useCallback(async () => {
    if (!editorRef.current) return;

    setSaveStatus("Saving...");
    const data = await editorRef.current.save();

    try {
      let saveDocId = currentDocId;

      // If no docId, create new editor document
      if (!saveDocId) {
        const res = await fetch(`/api/editor`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (!res.ok) {
          setSaveStatus("Save failed");
          setTimeout(() => setSaveStatus(""), 800);
          return;
        }

        const result = await res.json();
        saveDocId = result.data?._id;
        setCurrentDocId(saveDocId);
        console.log("Created new editor with ID:", saveDocId);
      } else {
        // Update existing editor
        const res = await fetch(`/api/editor/${saveDocId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (!res.ok) {
          setSaveStatus("Save failed");
          setTimeout(() => setSaveStatus(""), 800);
          return;
        }
      }

      setSaveStatus("Saved successfully!");
      setTimeout(() => setSaveStatus(""), 2000);
    } catch (err) {
      console.error("Save error:", err);
      setSaveStatus("Save error");
      setTimeout(() => setSaveStatus(""), 800);
    }
  }, [currentDocId]);

  const handleAutoSave = useCallback(() => {
    if (autoSaveRef.current) {
      clearTimeout(autoSaveRef.current);
    }

    autoSaveRef.current = setTimeout(() => {
      void handleSave();
    }, 800);
  }, [handleSave]);

  // Fetch initial data if only databaseId is provided
  useEffect(() => {
    if (databaseId && !docId && !currentDocId) {
      const fetchData = async () => {
        try {
          const res = await fetch(`/api/editor/${databaseId}`);
          if (res.ok) {
            const result = await res.json();
            initialDataRef.current = result?.content as OutputData;
            setCurrentDocId(databaseId);
          } else if (res.status === 404) {
            // No existing data, start with blank editor
            setCurrentDocId(databaseId);
          }
        } catch (err) {
          console.error("Error fetching editor data:", err);
          setCurrentDocId(databaseId);
        } finally {
          setIsLoading(false);
        }
      };

      fetchData();
    } else if (docId) {
      setCurrentDocId(docId);
      setIsLoading(false);
    }
  }, [currentDocId, databaseId, docId]);
  useEffect(() => {
    if (isLoading) return;

    const editor = new EditorJS({
      holder: holderId,
      data: initialDataRef.current,
      tools: {
        header: {
          class: Header as unknown as ToolConstructable,
          inlineToolbar: true,},
        list: {
          class: List,
          inlineToolbar: true,
        },
        table: Table,
        delimiter: Delimiter,
        quote: Quote,
        callout: CalloutTool,
        toggle: ToggleTool,
        pagelink: PageLinkTool,
        board: {
          class: BoardBlockTool as unknown as ToolConstructable,
          config: {
            databaseId: databaseId ?? currentDocId ?? "",
          },
        },
        tableview: {
          class: TableBlockTool as unknown as ToolConstructable,
          config: {
            databaseId: databaseId ?? currentDocId ?? "",
          },
        },
        timeline: {
          class: TimelineBlockTool as unknown as ToolConstructable,
          config: {
            databaseId: databaseId ?? currentDocId ?? "",
          },
        },
        chart: {
          class: ChartBlockTool as unknown as ToolConstructable,
          config: {
            databaseId: databaseId ?? currentDocId ?? "",
            projectId,
          },
        },
        document: {
          class: DocumentBlockTool as unknown as ToolConstructable,
          config: {
            databaseId: databaseId ?? currentDocId ?? "",
            templateName: "blank",
          },
        },
      },
      onChange: () => {
        handleAutoSave();
      },
      onReady: () => {
        editorRef.current = editor;
      },
    });

    return () => {
      if (autoSaveRef.current) {
        clearTimeout(autoSaveRef.current);
      }
      if (editorRef.current?.destroy) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  }, [currentDocId, holderId, isLoading, handleAutoSave]);

  useEffect(() => {
    if (preview.visible && previewRef.current) {
      previewRef.current.style.top = `${preview.top}px`;
      previewRef.current.style.left = `${preview.left}px`;
    }
  }, [preview]);

  useEffect(() => {
    const hidePreview = () => {
      setPreview((prev) => ({ ...prev, visible: false }));
    };

    const onPointerOver = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const menuItem = target.closest(".ce-popover-item, .ce-toolbox__button") as HTMLElement | null;
      if (!menuItem) {
        hidePreview();
        return;
      }

      const rawText = (menuItem.textContent || "").toLowerCase().replace(/\s+/g, " ").trim();
      let title = "";
      let description = "";
      let url: StaticImageData = textPreview;

      if (rawText.includes("text") || rawText.includes("paragraph")) {
        title = "Text";
        description = "Start writing plain text content.";
        url = textPreview;
      } else if (rawText.includes("header") || rawText.includes("heading")) {
        title = "Header";
        description = "Add a section heading to structure your page.";
        url = headerPreview;
      } else if (rawText.includes("page link") || rawText.includes("pagelink")) {
        title = "Page Link";
        description = "Link this block to another page or resource.";
        url = linkPreview;
      } else if (rawText.includes("table view")) {
        title = "Table View";
        description = "Insert a full table section in this editor page.";
        url = textPreview;
      } else if (rawText.includes("table")) {
        title = "Table";
        description = "Add a table to organize your data.";
        url = textPreview;
      } else if (rawText.includes("toggle")) {
        title = "Toggle";
        description = "Add a toggleable section to your page.";
        url = textPreview;
      } else if (rawText.includes("list")) {
        title = "List";
        description = "Add a bulleted or numbered list to your page.";
        url = textPreview;
      } else if (rawText.includes("quote")) {
        title = "Quote";
        description = "Add a quoted text block to your page.";
        url = textPreview;
      } else if (rawText.includes("delimiter")) {
        title = "Delimiter";
        description = "Add a visual separator to your page.";
        url = textPreview;
      } else if (rawText.includes("callout")) {
        title = "Callout";
        description = "Add a callout block to your page.";
        url = textPreview;
      } else if (rawText.includes("timeline")) {
        title = "Timeline";
        description = "Insert a full timeline section in this editor page.";
        url = textPreview;
      } else if (rawText.includes("board")) {
        title = "Board";
        description = "Insert a full board section in this editor page.";
        url = textPreview;
      } else if (rawText.includes("document")) {
        title = "Document";
        description = "Insert a full document section in this editor page.";
        url = textPreview;
      } else if (rawText.includes("chart")) {
        title = "Chart";
        description = "Insert a full chart section in this editor page.";
        url = textPreview;
      } else {
        hidePreview();
        return;
      }

      const rect = menuItem.getBoundingClientRect();
      setPreview({
        visible: true,
        top: rect.top + rect.height / 2,
        left: rect.right + 12,
        title,
        description,
        url,
      });
    };

    document.addEventListener("mouseover", onPointerOver);
    document.addEventListener("scroll", hidePreview, true);

    return () => {
      document.removeEventListener("mouseover", onPointerOver);
      document.removeEventListener("scroll", hidePreview, true);
    };
  }, []);

  if (isLoading) {
    return <div className="text-center py-8">Loading editor...</div>;
  }

  return (
    <div>
      <div className="mt-4 text-right mr-2 items-center gap-4">
        {/* <p
          onClick={() => void handleSave()}
          className="px-4 py-2 bg-transparent text-white rounded hover:bg-blue-600 transition"
        > */}
          {/* Save Now */}
        {/* </p> */}
        {saveStatus && (
          <span className={`text-sm ${
            saveStatus.includes("Saved") ? "text-green-600" : "text-gray-600"
          }`}>
            {saveStatus}
          </span>
        )}
      </div>
      <div id={holderId} className="editor-box" />
    

      {/* <div className="mt-4 items-center gap-4">
        <p
          onClick={() => void handleSave()}
          className="px-4 py-2 bg-transparent text-white rounded hover:bg-blue-600 transition"
        >
          Save Now
        </p>
        {saveStatus && (
          <span className={`text-sm ${
            saveStatus.includes("Saved") ? "text-green-600" : "text-gray-600"
          }`}>
            {saveStatus}
          </span>
        )}
      </div> */}

      {preview.visible && (
        <div
          ref={previewRef}
          className="fixed -translate-y-1/2 bg-gray-800 text-gray-50 rounded-xl px-3 py-2 w-[250px] shadow-2xl z-9999 pointer-events-none"
        >
          <div className="text-[13px] font-bold mb-1">{preview.title}</div>
          <div className="text-xs opacity-90">{preview.description}</div>
          <Image src={preview.url} alt="Preview Image" className="mt-2 rounded" />
        </div>
      )}
    </div>
  );
}