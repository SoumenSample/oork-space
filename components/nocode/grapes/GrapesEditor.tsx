"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import grapesjs from "grapesjs";
import "grapesjs/dist/css/grapes.min.css";
import "@/styles/nocode-builder.css";

type Props = {
  initialProjectData?: unknown;
  pageName?: string;
  pageSlug?: string;
  appId?: string;
  onSave: (payload: {
    grapesProjectData: unknown;
    html: string;
    css: string;
    js: string;
    bindings: Array<Record<string, unknown>>;
  }) => Promise<void>;
  onPublish: () => Promise<void>;
};

const DEFAULT_HTML = `
<main class="wb-page">
  <nav class="wb-navbar">
    <div class="wb-brand">OorkSite</div>
    <div class="wb-nav-links">
      <a href="#">Home</a>
      <a href="#">Features</a>
      <a href="#">Contact</a>
    </div>
  </nav>

  <section class="wb-hero">
    <h1>Build your landing page visually</h1>
    <p>Drag blocks from the left panel and style them from the right panel.</p>
    <a class="wb-btn" href="#">Get Started</a>
  </section>

  <section class="wb-rectangle">
    <h2>Rectangle Section</h2>
    <p>This is the rectangle section block. Use it as a reusable content area.</p>
  </section>

  <footer class="wb-footer">
    <p>Copyright 2026 Oork Space. All rights reserved.</p>
  </footer>
</main>
`;

const DEFAULT_CSS = `
  body { margin: 0; background: #f8fafc; font-family: Inter, Arial, sans-serif; color: #0f172a; }
  .wb-page { width: 100%; max-width: none; margin: 0; padding: 32px 24px; }
  .wb-navbar { display:flex;justify-content:space-between;align-items:center;padding:14px 18px;background:#ffffff;border:1px solid #cbd5e1;border-radius:14px;margin-bottom:16px; }
  .wb-brand { font-weight: 800; color: #0f172a; }
  .wb-nav-links { display:flex;gap:14px; }
  .wb-nav-links a { color:#334155;text-decoration:none;font-weight:600; }
  .wb-hero { background: linear-gradient(120deg, #0f172a 0%, #1e293b 100%); color: #e2e8f0; border-radius: 20px; padding: 40px; }
  .wb-hero h1 { margin: 0 0 12px; font-size: 42px; line-height: 1.1; }
  .wb-hero p { margin: 0 0 20px; color: #cbd5e1; }
  .wb-btn { display: inline-block; background: #22c55e; color: #052e16; font-weight: 700; text-decoration: none; border-radius: 10px; padding: 12px 18px; }
  .wb-rectangle { margin-top: 22px; background: #ffffff; border: 2px solid #cbd5e1; border-radius: 16px; padding: 26px; min-height: 180px; }
  .wb-rectangle h2 { margin: 0 0 10px; }
  .wb-footer { margin-top: 22px; background:#0f172a;color:#cbd5e1;border-radius:14px;padding:20px;text-align:center; }
`;

function normalizeProjectData(data: unknown): Record<string, unknown> | null {
  if (!data || typeof data !== "object") return null;
  return data as Record<string, unknown>;
}

const TEXT_EDITABLE_TAGS = new Set([
  "a",
  "button",
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "span",
  "label",
  "div",
]);

function isTextEditableTag(tagName: unknown): boolean {
  return TEXT_EDITABLE_TAGS.has(String(tagName || "").toLowerCase());
}

export default function GrapesEditor({
  initialProjectData,
  pageName,
  pageSlug,
  appId,
  onSave,
  onPublish,
}: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<ReturnType<typeof grapesjs.init> | null>(null);
  const autosaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enforceIntervalRef = useRef<number | null>(null);
  const savingRef = useRef(false);

  const [status, setStatus] = useState("Ready");
  const [isPublishing, setIsPublishing] = useState(false);
  const [isImageSelected, setIsImageSelected] = useState(false);

  const forceCanvasFill = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;

    const canvas = root.querySelector(".gjs-cv-canvas") as HTMLElement | null;
    const frames = root.querySelector(".gjs-cv-frames") as HTMLElement | null;
    const wrapper = root.querySelector(".gjs-frame-wrapper") as HTMLElement | null;
    const frame = root.querySelector(".gjs-frame") as HTMLIFrameElement | null;

    if (canvas) {
      canvas.style.position = "absolute";
      canvas.style.inset = "0";
      canvas.style.width = "100%";
      canvas.style.padding = "0";
      canvas.style.height = "100%";
      canvas.style.minHeight = "100%";
    }

    if (frames) {
      frames.style.position = "absolute";
      frames.style.inset = "0";
      frames.style.display = "block";
      frames.style.overflow = "hidden";
      frames.style.width = "100%";
      frames.style.height = "100%";
    }

    if (wrapper) {
      wrapper.style.position = "absolute";
      wrapper.style.inset = "0";
      wrapper.style.width = "100%";
      wrapper.style.minWidth = "100%";
      wrapper.style.maxWidth = "100%";
      wrapper.style.left = "0";
      wrapper.style.right = "0";
      wrapper.style.margin = "0";
      wrapper.style.transform = "none";
      wrapper.style.height = "100%";
    }

    if (frame) {
      frame.removeAttribute("width");
      frame.removeAttribute("height");
      frame.style.width = "100%";
      frame.style.height = "100%";
      frame.style.minHeight = "100%";
      frame.style.display = "block";
    }

    const editor = editorRef.current;
    if (!editor) return;

    const frameDoc = editor.Canvas.getDocument();
    if (!frameDoc) return;

    const frameHtml = frameDoc.documentElement;
    const frameBody = frameDoc.body;
    if (!frameHtml || !frameBody) return;

    frameHtml.style.width = "100%";
    frameHtml.style.height = "100%";

    frameBody.style.width = "100%";
    frameBody.style.minWidth = "100%";
    frameBody.style.height = "100%";
    frameBody.style.minHeight = "100%";
    frameBody.style.margin = "0";
    frameBody.style.background = "#ffffff";

    const first = frameBody.firstElementChild as HTMLElement | null;
    if (first) {
      first.style.width = "100%";
      first.style.maxWidth = "none";
      first.style.marginLeft = "0";
      first.style.marginRight = "0";
      first.style.boxSizing = "border-box";
    }

    const fillStyleId = "wb-canvas-fill-style";
    let fillStyle = frameDoc.getElementById(fillStyleId) as HTMLStyleElement | null;
    if (!fillStyle) {
      fillStyle = frameDoc.createElement("style");
      fillStyle.id = fillStyleId;
      frameDoc.head.appendChild(fillStyle);
    }
    fillStyle.textContent = `
      html, body { width: 100% !important; min-width: 100% !important; height: 100% !important; min-height: 100% !important; margin: 0 !important; }
      body > *:first-child { width: 100% !important; max-width: none !important; margin-left: 0 !important; margin-right: 0 !important; box-sizing: border-box !important; }
    `;
  }, []);

  const runSave = useCallback(async () => {
    const editor = editorRef.current;
    if (!editor || savingRef.current) return;

    try {
      savingRef.current = true;
      setStatus("Saving draft...");

      await onSave({
        grapesProjectData: editor.getProjectData(),
        html: editor.getHtml(),
        css: editor.getCss() || "",
        js: editor.getJs() || "",
        bindings: [],
      });

      setStatus(`Draft saved at ${new Date().toLocaleTimeString()}`);
    } catch {
      setStatus("Save failed");
    } finally {
      savingRef.current = false;
    }
  }, [onSave]);

  const runPublish = useCallback(async () => {
    try {
      setIsPublishing(true);
      await runSave();
      setStatus("Publishing...");
      await onPublish();
      setStatus(`Published at ${new Date().toLocaleTimeString()}`);
    } catch {
      setStatus("Publish failed");
    } finally {
      setIsPublishing(false);
    }
  }, [onPublish, runSave]);

  useEffect(() => {
    if (!rootRef.current || editorRef.current) return;

    const editor = grapesjs.init({
      container: rootRef.current,
      fromElement: false,
      height: "100%",
      width: "auto",
      storageManager: false,
      deviceManager: {
        devices: [
          { id: "desktop", name: "Desktop", width: "" },
        ],
      },
      panels: { defaults: [] },
      blockManager: {
        appendTo: "#gjs-blocks",
      },
      styleManager: {
        appendTo: "#gjs-styles",
        sectors: [
          { name: "Layout", open: true, properties: ["display", "position", "top", "right", "left", "bottom"] },
          { name: "Dimension", open: false, properties: ["width", "height", "max-width", "min-height", "margin", "padding"] },
          { name: "Typography", open: false, properties: ["font-size", "font-weight", "line-height", "letter-spacing", "color", "text-align"] },
          { name: "Decorations", open: false, properties: ["background-color", "border", "border-radius", "box-shadow", "opacity"] },
        ],
      },
      layerManager: {
        appendTo: "#gjs-layers",
      },
      selectorManager: {
        appendTo: "#gjs-selectors",
        componentFirst: true,
      },
      traitManager: {
        appendTo: "#gjs-traits",
      },
      canvas: {
        styles: [DEFAULT_CSS],
      },
    });

    editor.Commands.add("wb-edit-text", {
      run(ed) {
        const component = ed.getSelected();
        if (!component) return;

        const currentText = String(component.view?.el?.textContent || "").trim();
        const nextText = window.prompt("Edit text", currentText);
        if (nextText === null) return;

        component.components(nextText);
      },
    });

    editor.Commands.add("wb-change-image", {
      run(ed) {
        const component = ed.getSelected();
        if (!component) return;

        const attrs = (component.getAttributes?.() || {}) as Record<string, string>;
        const currentSrc = String(attrs.src || "");
        const nextSrc = window.prompt("Image URL", currentSrc);
        if (nextSrc === null) return;

        const cleanSrc = nextSrc.trim();
        if (!cleanSrc) return;

        component.addAttributes({ src: cleanSrc });
      },
    });

    editor.Commands.add("wb-upload-image", {
      async run(ed) {
        const component = ed.getSelected();
        if (!component) return;

        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";

        input.onchange = async () => {
          const file = input.files?.[0];
          if (!file) return;

          try {
            setStatus("Uploading image...");

            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch("/api/upload", {
              method: "POST",
              body: formData,
            });

            if (!res.ok) {
              throw new Error("Upload failed");
            }

            const json = await res.json();
            const url = String(json?.url || "");
            if (!url) {
              throw new Error("No uploaded URL returned");
            }

            component.addAttributes({ src: url });
            setStatus(`Image uploaded at ${new Date().toLocaleTimeString()}`);
          } catch {
            setStatus("Image upload failed");
          }
        };

        input.click();
      },
    });

    const applyEditToolbar = (component: any) => {
      const tag = String(component?.get?.("tagName") || "").toLowerCase();
      const toolbar = Array.isArray(component?.get?.("toolbar")) ? [...component.get("toolbar")] : [];

      if (isTextEditableTag(tag) && !toolbar.some((t: any) => t?.command === "wb-edit-text")) {
        toolbar.unshift({
          attributes: { class: "fa fa-pencil", title: "Edit text" },
          command: "wb-edit-text",
        });
      }

      if (tag === "img" && !toolbar.some((t: any) => t?.command === "wb-change-image")) {
        toolbar.unshift({
          attributes: { class: "fa fa-image", title: "Change image" },
          command: "wb-change-image",
        });
      }

      if (tag === "img" && !toolbar.some((t: any) => t?.command === "wb-upload-image")) {
        toolbar.unshift({
          attributes: { class: "fa fa-upload", title: "Upload image" },
          command: "wb-upload-image",
        });
      }

      component.set("toolbar", toolbar);
    };

    editor.on("component:selected", (component: any) => {
      if (!component) return;
      applyEditToolbar(component);

      const tag = String(component.get("tagName") || "").toLowerCase();
      setIsImageSelected(tag === "img");
      if (tag === "img") {
        component.set("traits", ["alt", { type: "text", name: "src", label: "Image URL" }]);
      }
    });

    editor.on("component:dblclick", (component: any) => {
      const tag = String(component?.get?.("tagName") || "").toLowerCase();
      editor.select(component);

      if (isTextEditableTag(tag)) {
        editor.runCommand("wb-edit-text");
        return;
      }

      if (tag === "img") {
        editor.runCommand("wb-change-image");
      }
    });

    editor.on("component:deselected", () => {
      setIsImageSelected(false);
    });

    editor.BlockManager.add("navbar", {
      label: "Navbar",
      category: "Static Site",
      content:
        '<nav class="wb-navbar"><div class="wb-brand">Brand</div><div class="wb-nav-links"><a href="#">Home</a><a href="#">About</a><a href="#">Contact</a></div></nav>',
    });

    editor.BlockManager.add("hero", {
      label: "Hero",
      category: "Static Site",
      content:
        '<section class="wb-hero"><h1>Hero title</h1><p>Hero subtitle</p><a class="wb-btn" href="#">Get Started</a></section>',
    });

    editor.BlockManager.add("image", {
      label: "Image",
      category: "Static Site",
      content:
        '<img src="https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop" alt="placeholder" style="max-width:100%;border-radius:14px;"/>',
    });

    editor.BlockManager.add("heading", {
      label: "Heading",
      category: "Basic",
      content: "<h2>Section heading</h2>",
    });

    editor.BlockManager.add("paragraph", {
      label: "Paragraph",
      category: "Basic",
      content: "<p>Write your content here.</p>",
    });

    editor.BlockManager.add("button", {
      label: "Button",
      category: "Basic",
      content: '<a class="wb-btn" href="#">Click me</a>',
    });

    editor.BlockManager.add("section", {
      label: "Section",
      category: "Basic",
      content:
        '<section class="wb-rectangle"><h2>Section title</h2><p>Section content</p></section>',
    });

    editor.BlockManager.add("form", {
      label: "Form",
      category: "Static Site",
      content:
        `<form data-workflow-key="" data-app-id="${appId || ""}" style="display:flex;gap:8px;flex-wrap:wrap;padding:16px;background:#fff;border:1px solid #cbd5e1;border-radius:12px;"><input name="email" type="email" placeholder="Email" required style="flex:1;min-width:180px;padding:10px;border:1px solid #cbd5e1;border-radius:8px;"/><button type="submit" style="padding:10px 14px;border:none;border-radius:8px;background:#2563eb;color:#fff;font-weight:600;">Submit</button></form>`,
    });

    editor.BlockManager.add("footer", {
      label: "Footer",
      category: "Static Site",
      content:
        '<footer class="wb-footer"><p>Copyright 2026. All rights reserved.</p></footer>',
    });

    const normalizedProject = normalizeProjectData(initialProjectData);
    if (normalizedProject) {
      try {
        editor.loadProjectData(normalizedProject);
      } catch {
        editor.setComponents(DEFAULT_HTML);
        editor.setStyle(DEFAULT_CSS);
      }
    } else {
      editor.setComponents(DEFAULT_HTML);
      editor.setStyle(DEFAULT_CSS);
    }

    editor.setDevice("desktop");
    forceCanvasFill();
    setTimeout(() => forceCanvasFill(), 0);
    setTimeout(() => forceCanvasFill(), 100);
    setTimeout(() => forceCanvasFill(), 350);
    setTimeout(() => forceCanvasFill(), 800);

    if (enforceIntervalRef.current) {
      window.clearInterval(enforceIntervalRef.current);
    }
    enforceIntervalRef.current = window.setInterval(() => {
      forceCanvasFill();
    }, 350);

    const onWindowResize = () => forceCanvasFill();
    window.addEventListener("resize", onWindowResize);

    editor.on("load", () => {
      editor.setDevice("desktop");
      forceCanvasFill();
    });

    editor.on("canvas:frame:load", () => {
      forceCanvasFill();
    });

    editor.on("update", () => {
      if (autosaveRef.current) {
        clearTimeout(autosaveRef.current);
      }

      setStatus("Unsaved changes");
      autosaveRef.current = setTimeout(() => {
        void runSave();
        forceCanvasFill();
      }, 1200);
    });

    editorRef.current = editor;

    return () => {
      if (autosaveRef.current) {
        clearTimeout(autosaveRef.current);
      }
      if (enforceIntervalRef.current) {
        window.clearInterval(enforceIntervalRef.current);
        enforceIntervalRef.current = null;
      }
      window.removeEventListener("resize", onWindowResize);
      editor.destroy();
      editorRef.current = null;
    };
  }, [appId, forceCanvasFill, initialProjectData, runSave]);

  const undo = () => {
    editorRef.current?.UndoManager.undo();
  };

  const redo = () => {
    editorRef.current?.UndoManager.redo();
  };

  return (
    <div className="nocode-builder-shell">
      <div className="nocode-builder-toolbar">
        <div className="nocode-toolbar-title-wrap">
          <h2 className="nocode-toolbar-title">{pageName || "Website Builder"}</h2>
          <p className="nocode-toolbar-status">{status}</p>
        </div>

        <div className="nocode-toolbar-actions">
          <button className="nocode-btn nocode-btn-secondary" onClick={undo}>Undo</button>
          <button className="nocode-btn nocode-btn-secondary" onClick={redo}>Redo</button>
          {isImageSelected ? (
            <>
              <button className="nocode-btn nocode-btn-secondary" onClick={() => editorRef.current?.runCommand("wb-change-image")}>
                Image URL
              </button>
              <button className="nocode-btn nocode-btn-secondary" onClick={() => editorRef.current?.runCommand("wb-upload-image")}>
                Upload Image
              </button>
            </>
          ) : null}
          {pageSlug ? (
            <a className="nocode-btn nocode-btn-secondary" href={`/p/${pageSlug}`} target="_blank" rel="noreferrer">
              Open Live
            </a>
          ) : null}
          <button className="nocode-btn nocode-btn-secondary" onClick={() => void runSave()}>
            Save Draft
          </button>
          <button className="nocode-btn nocode-btn-primary" onClick={() => void runPublish()} disabled={isPublishing}>
            {isPublishing ? "Publishing..." : "Publish"}
          </button>
        </div>
      </div>

      <div className="nocode-builder-grid">
        <aside className="nocode-panel nocode-panel-left">
          <h3>Blocks</h3>
          <div id="gjs-blocks" className="nocode-pane-scroll" />

          <h3>Layers</h3>
          <div id="gjs-layers" className="nocode-pane-scroll" />
        </aside>

        <div className="nocode-canvas-wrap">
          <div ref={rootRef} className="nocode-canvas-host" />
        </div>

        <aside className="nocode-panel nocode-panel-right">
          <h3>Properties</h3>
          <div id="gjs-traits" className="nocode-pane-scroll" />

          <h3>Styles</h3>
          <div id="gjs-styles" className="nocode-pane-scroll" />
        </aside>
      </div>
    </div>
  );
}