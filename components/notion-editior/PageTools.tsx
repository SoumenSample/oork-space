
import { showPreview, hidePreview } from "./preview";
export default class PageTool {
  data: any;
  wrapper: HTMLElement;

  constructor({ data }: any) {
    this.data = data || {};
    this.wrapper = document.createElement("div");
  }

  static get toolbox() {
    return {
      title: "Page",
      icon: "📄",
    };
  }

  render() {
  this.wrapper.classList.add("page-link");

  const link = document.createElement("div");
  link.innerText = this.data.url || "Hover me";
  link.classList.add("page-link-text");

  // ✅ HOVER EVENT
  link.onmouseenter = (e) => {
    showPreview(e, this.data.url);
  };

  link.onmouseleave = () => {
    hidePreview();
  };

  this.wrapper.appendChild(link);

  return this.wrapper;
}

  save() {
    return this.data;
  }
}