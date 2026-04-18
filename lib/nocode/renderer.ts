import sanitizeHtml from "sanitize-html";
// @ts-ignore
import type { IOptions } from "sanitize-html";

export function safeHtml(html: string): string {
  return sanitizeHtml(html || "", {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      "img",
      "section",
      "article",
      "style",
      "form",
      "label",
      "input",
      "button",
      "textarea",
      "select",
      "option",
      "iframe",
      "video",
      "audio",
      "source",
      "track",
      "figure",
      "figcaption",
    ]),
    allowedAttributes: {
      "*": ["class", "id", "style", "data-*", "role"],
      a: ["href", "target", "rel", "role"],
      img: ["src", "alt", "width", "height"],
      iframe: [
        "src",
        "title",
        "width",
        "height",
        "frameborder",
        "allow",
        "allowfullscreen",
        "loading",
        "referrerpolicy",
        "sandbox",
      ],
      video: ["src", "controls", "autoplay", "muted", "loop", "playsinline", "poster", "width", "height", "preload"],
      audio: ["src", "controls", "autoplay", "loop", "muted", "preload"],
      source: ["src", "type", "media", "sizes", "srcset"],
      track: ["kind", "src", "srclang", "label", "default"],
      form: ["method", "action", "data-workflow-key", "data-app-id", "data-project-id", "data-database-id", "data-workflow-alert"],
      input: ["name", "type", "value", "placeholder", "required", "min", "max", "checked"],
      button: ["type"],
      textarea: ["name", "placeholder", "required", "min", "max"],
      select: ["name", "required", "multiple"],
      option: ["value", "selected"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel", "data"],
    allowedSchemesByTag: {
      iframe: ["http", "https"],
      source: ["http", "https", "data"],
      video: ["http", "https", "data"],
      audio: ["http", "https", "data"],
    },
  });
}

export function safeCss(css: string): string {
  return String(css || "");
}