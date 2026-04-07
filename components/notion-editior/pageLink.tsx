export default class PageLinkTool {
  data: { url?: string };
  wrapper: HTMLElement;

  constructor({ data }: { data?: { url?: string } }) {
    this.data = data || {};
    this.wrapper = document.createElement("div");
  }

  static get toolbox() {
    return {
      title: "Page Link",
      icon: "🔗",
    };
  }

  render() {
    this.wrapper.classList.add("page-link");

    const input = document.createElement("input");
    input.placeholder = "Enter page URL...";
    input.value = this.data.url || "";

    input.onchange = () => {
      this.data.url = input.value;
    };

    this.wrapper.appendChild(input);

    return this.wrapper;
  }

  save() {
    return this.data;
  }
}