import { createRoot, type Root } from "react-dom/client";
import ChartView from "@/components/charts/ChartView";

type ChartBlockData = {
  databaseId?: string;
  projectId?: string;
};

type ChartToolConfig = {
  databaseId?: string;
  projectId?: string;
};

type ChartToolArgs = {
  data?: ChartBlockData;
  config?: ChartToolConfig;
};

export default class ChartBlockTool {
  data: ChartBlockData;
  config: ChartToolConfig;
  wrapper: HTMLDivElement;
  root: Root | null;

  constructor({ data, config }: ChartToolArgs) {
    this.data = data || {};
    this.config = config || {};
    this.wrapper = document.createElement("div");
    this.root = null;
  }

  static get toolbox() {
    return {
      title: "Chart",
      icon: "📈",
    };
  }

  render() {
    const databaseId = this.data.databaseId || this.config.databaseId || "";
    const projectId = this.data.projectId || this.config.projectId;
    this.wrapper.className = "my-2";

    if (!databaseId) {
      this.wrapper.innerHTML = `
        <div class="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Chart view needs a database context.
        </div>
      `;
      return this.wrapper;
    }

    this.data.databaseId = databaseId;
    if (projectId) this.data.projectId = projectId;

    this.root = createRoot(this.wrapper);
    this.root.render(
      <div className="rounded-2xl  bg-transparent p-2 shadow-sm">
        <ChartView databaseId={databaseId} projectId={projectId} />
      </div>
    );

    return this.wrapper;
  }

  save() {
    return {
      databaseId: this.data.databaseId || this.config.databaseId || "",
      projectId: this.data.projectId || this.config.projectId,
    };
  }

  destroy() {
    this.root?.unmount();
    this.root = null;
  }
}