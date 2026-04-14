import { createRoot, type Root } from "react-dom/client";
import TableView from "@/components/gallery/TableView";

type TableBlockData = {
  databaseId?: string;
};

type TableToolConfig = {
  databaseId?: string;
};

type TableToolArgs = {
  data?: TableBlockData;
  config?: TableToolConfig;
};

export default class TableBlockTool {
  data: TableBlockData;
  config: TableToolConfig;
  wrapper: HTMLDivElement;
  root: Root | null;

  constructor({ data, config }: TableToolArgs) {
    this.data = data || {};
    this.config = config || {};
    this.wrapper = document.createElement("div");
    this.root = null;
  }

  
  static get toolbox() {
    return {
      title: "Table View",
      icon: "📊",
    };
  }

  render() {
    const databaseId = this.data.databaseId || this.config.databaseId || "";
    this.wrapper.className = "my-2";

    if (!databaseId) {
      this.wrapper.innerHTML = `
        <div class="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Table view needs a database context.
        </div>
      `;
      return this.wrapper;
    }

    const isDark =
      document.documentElement.classList.contains("dark") ||
      document.documentElement.getAttribute("data-theme") === "dark";

    this.data.databaseId = databaseId;
    this.root = createRoot(this.wrapper);
    this.root.render(
      <div className={`${isDark ? 'bg-transparent ' : 'bg-transparent border-gray-200'} rounded-2xl border p-1 w-220 shadow-sm`}>
        <TableView databaseId={databaseId} isDark={isDark} />
      </div>
    );

    return this.wrapper;
  }

  save() {
    return {
      databaseId: this.data.databaseId || this.config.databaseId || "",
    };
  }

  destroy() {
    this.root?.unmount();
    this.root = null;
  }
}