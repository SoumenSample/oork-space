export default class CalloutTool {
  data: any;
  wrapper: HTMLElement;

  constructor({ data }: any) {
    this.data = data || {};
    this.wrapper = document.createElement("div");
  }

  static get toolbox() {
    return {
      title: "Callout",
      icon: "💡",
    };
  }

  render() {
    this.wrapper.classList.add("callout");

    const input = document.createElement("div");
    input.contentEditable = "true";
    input.innerText = this.data.text || "Write callout...";

    input.oninput = () => {
      this.data.text = input.innerText;
    };

    this.wrapper.appendChild(input);

    return this.wrapper;
  }

  save() {
    return this.data;
  }
}