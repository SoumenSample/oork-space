export default class ToggleTool {
  data: any;
  wrapper: HTMLElement;

  constructor({ data }: any) {
    this.data = data || {};
    this.wrapper = document.createElement("div");
  }

  static get toolbox() {
    return {
      title: "Toggle",
      icon: "▶️",
    };
  }

  render() {
    const details = document.createElement("details");

    const summary = document.createElement("summary");
    summary.innerText = this.data.title || "Toggle";

    const content = document.createElement("div");
    content.contentEditable = "true";
    content.innerText = this.data.content || "Hidden content";

    content.oninput = () => {
      this.data.content = content.innerText;
    };

    details.appendChild(summary);
    details.appendChild(content);

    this.wrapper.appendChild(details);

    return this.wrapper;
  }

  save() {
    return this.data;
  }
}