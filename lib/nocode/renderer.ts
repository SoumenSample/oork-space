import sanitizeHtml from "sanitize-html";
// @ts-ignore
import type { IOptions } from "sanitize-html";

export function safeHtml(html: string): string {
  return sanitizeHtml(html || "", {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "section", "article", "style"]),
    allowedAttributes: {
      "*": ["class", "id", "style", "data-*", "role"],
      a: ["href", "target", "rel", "role"],
      img: ["src", "alt", "width", "height"],
      form: ["method", "action", "data-workflow-key", "data-app-id"],
      input: ["name", "type", "value", "placeholder", "required", "min", "max", "checked"],
      button: ["type"],
      textarea: ["name", "placeholder", "required", "min", "max"],
      select: ["name", "required", "multiple"],
      option: ["value", "selected"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel", "data"],
  });
}

export function safeCss(css: string): string {
  return String(css || "");
}