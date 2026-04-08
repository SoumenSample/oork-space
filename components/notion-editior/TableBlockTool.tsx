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

    this.data.databaseId = databaseId;
    this.root = createRoot(this.wrapper);
    this.root.render(
      <div className="rounded-2xl border border-gray-200 bg-white p-2 shadow-sm">
        <TableView databaseId={databaseId} />
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