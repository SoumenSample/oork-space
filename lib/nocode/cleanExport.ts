const EDITOR_ATTRS = [
  /\sdata-gjs-[a-zA-Z0-9_-]+="[^"]*"/g,
  /\scontenteditable="(?:true|false)"/g,
  /\sdraggable="(?:true|false)"/g,
];

const EDITOR_CLASS_TOKENS = [
  "gjs-selected",
  "gjs-hovered",
  "gjs-highlighter",
  "gjs-comp-selected",
];

function stripEditorClasses(html: string): string {
  return html.replace(/class="([^"]*)"/g, (_, raw: string) => {
    const cleaned = raw
      .split(/\s+/)
      .filter(Boolean)
      .filter((token) => !EDITOR_CLASS_TOKENS.includes(token) && !token.startsWith("gjs-"));

    if (!cleaned.length) {
      return "";
    }

    return `class="${cleaned.join(" ")}"`;
  });
}

export function cleanBuilderHtml(html: string): string {
  let output = String(html || "");

  for (const pattern of EDITOR_ATTRS) {
    output = output.replace(pattern, "");
  }

  output = stripEditorClasses(output);
  output = output.replace(/\s{2,}/g, " ");
  return output.trim();
}

export function cleanBuilderCss(css: string): string {
  let output = String(css || "");

  // Remove editor-only style rules that should never be shipped to production output.
  output = output.replace(/[#.]gjs[-a-zA-Z0-9_\s,.>:+*\[\]\"'=()]*\{[^{}]*\}/g, "");
  output = output.replace(/\/\*\s*gjs[\s\S]*?\*\//gi, "");
  output = output.replace(/\n{3,}/g, "\n\n");

  return output.trim();
}
