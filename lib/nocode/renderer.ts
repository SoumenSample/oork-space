import sanitizeHtml from "sanitize-html";
// @ts-ignore
import type { IOptions } from "sanitize-html";

export function safeHtml(html: string): string {
  return sanitizeHtml(html || "", {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "section", "article", "style"]),
    allowedAttributes: {
      "*": ["class", "id", "style", "data-*"],
      a: ["href", "target", "rel"],
      img: ["src", "alt", "width", "height"],
      form: ["method", "action", "data-workflow-key", "data-app-id"],
      input: ["name", "type", "value", "placeholder", "required"],
      button: ["type"],
      textarea: ["name", "placeholder"],
      select: ["name"],
      option: ["value"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel", "data"],
  });
}

export function safeCss(css: string): string {
  return String(css || "");
}