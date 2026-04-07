import EditorComponent from "@/components/notion-editior/EditorComponent";
import "@/styles/editor.css";

export default function EditorPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">
        Editor.js Table Example
      </h1>

      <EditorComponent />
    </div>
  );
}