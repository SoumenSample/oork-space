import { createRoot, type Root } from "react-dom/client";
import BoardView from "@/components/board/BoardView";

type BoardBlockData = {
  databaseId?: string;
};

type BoardToolConfig = {
  databaseId?: string;
};

type BoardToolArgs = {
  data?: BoardBlockData;
  config?: BoardToolConfig;
};

export default class BoardBlockTool {
  data: BoardBlockData;
  config: BoardToolConfig;
  wrapper: HTMLDivElement;
  root: Root | null;

  constructor({ data, config }: BoardToolArgs) {
    this.data = data || {};
    this.config = config || {};
    this.wrapper = document.createElement("div");
    this.root = null;
  }

  static get toolbox() {
    return {
      title: "Board",
      icon: "📋",
    };
  }

  render() {
    const databaseId = this.data.databaseId || this.config.databaseId || "";
    this.wrapper.className = "my-2";

    if (!databaseId) {
      this.wrapper.innerHTML = `
        <div class="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Board needs a database context.
        </div>
      `;
      return this.wrapper;
    }

    this.data.databaseId = databaseId;
    this.root = createRoot(this.wrapper);
    this.root.render(
      <div className="rounded-2xl border border-gray-200 bg-white p-2 shadow-sm">
        <BoardView databaseId={databaseId} />
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