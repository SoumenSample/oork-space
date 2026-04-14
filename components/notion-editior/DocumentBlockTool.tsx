import { createRoot, type Root } from "react-dom/client";
import DocumentationView from "@/components/documentation/DocumentationView";

type DocumentBlockData = {
  databaseId?: string;
  templateName?: string;
};

type DocumentToolConfig = {
  databaseId?: string;
  templateName?: string;
};

type DocumentToolArgs = {
  data?: DocumentBlockData;
  config?: DocumentToolConfig;
};

export default class DocumentBlockTool {
  data: DocumentBlockData;
  config: DocumentToolConfig;
  wrapper: HTMLDivElement;
  root: Root | null;

  constructor({ data, config }: DocumentToolArgs) {
    this.data = data || {};
    this.config = config || {};
    this.wrapper = document.createElement("div");
    this.root = null;
  }

  static get toolbox() {
    return {
      title: "Document",
      icon: "📝",
    };
  }

  render() {
    const databaseId = this.data.databaseId || this.config.databaseId || "";
    const templateName = this.data.templateName || this.config.templateName || "blank";
    this.wrapper.className = "my-2";

    if (!databaseId) {
      this.wrapper.innerHTML = `
        <div class="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Document view needs a database context.
        </div>
      `;
      return this.wrapper;
    }

    this.data.databaseId = databaseId;
    this.data.templateName = templateName;

    this.root = createRoot(this.wrapper);
    this.root.render(
      <div className="rounded-2xl border border-gray-200 bg-white p-1 w-220 shadow-sm">
        <DocumentationView databaseId={databaseId} templateName={templateName} />
      </div>
    );

    return this.wrapper;
  }

  save() {
    return {
      databaseId: this.data.databaseId || this.config.databaseId || "",
      templateName: this.data.templateName || this.config.templateName || "blank",
    };
  }

  destroy() {
    this.root?.unmount();
    this.root = null;
  }
}