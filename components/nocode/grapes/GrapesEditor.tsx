"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "@/styles/nocode-builder.css";

type SeoDraft = {
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
};

type Props = {
  pageId?: string;
  pageUpdatedAt?: string;
  initialProjectData?: unknown;
  initialHtml?: string;
  initialCss?: string;
  initialSeo?: Partial<SeoDraft>;
  pageName?: string;
  pageSlug?: string;
  appId?: string;
  onSave: (payload: {
    grapesProjectData: unknown;
    html: string;
    css: string;
    js: string;
    bindings: Array<Record<string, unknown>>;
    seo: SeoDraft;
  }) => Promise<void>;
  onPublish: () => Promise<void>;
};

type AppPageItem = { _id: string; name: string; slug: string };
type WorkflowItem = { _id: string; name: string; key: string; status: string; updatedAt?: string };
type WorkflowStepLog = {
  nodeId?: string;
  nodeType?: string;
  status?: string;
  error?: string;
  startedAt?: string;
  endedAt?: string;
};
type WorkflowRunItem = {
  _id: string;
  workflowId?: string;
  status?: string;
  error?: string;
  createdAt?: string;
  finishedAt?: string;
  triggerType?: string;
  stepLogs?: WorkflowStepLog[];
};
type WorkspaceProjectItem = {
  _id: string;
  name: string;
  emoji?: string;
};
type WorkspaceDatabaseItem = {
  _id: string;
  name: string;
  viewType?: string;
};
type DatabasePreviewItem = {
  _id: string;
  values?: Record<string, unknown>;
  createdAt?: string;
};
type SavedSnippet = { id: string; name: string; html: string; savedAt: number };
type FormFieldType =
  | "text"
  | "email"
  | "password"
  | "number"
  | "tel"
  | "url"
  | "date"
  | "textarea"
  | "checkbox"
  | "select"
  | "search"
  | "radio"
  | "range"
  | "datetime-local"
  | "image"
  | "file";

type FormField = {
  id: string;
  type: FormFieldType;
  name: string;
  label: string;
  placeholder: string;
  required: boolean;
  checked: boolean;
  options: string;
  min: string;
  max: string;
};

const FORM_FIELD_TYPES_WITH_OPTIONS = new Set<FormFieldType>(["select", "radio"]);
const FORM_FIELD_TYPES_WITH_PLACEHOLDER = new Set<FormFieldType>([
  "text",
  "email",
  "password",
  "number",
  "tel",
  "url",
  "search",
  "textarea",
]);
const FORM_FIELD_TYPES_WITH_MIN_MAX = new Set<FormFieldType>(["number", "date", "datetime-local", "range"]);

const INPUT_FORM_QUICK_BLOCKS = [
  { id: "input-form-workflow-scope", label: "Workflow Scope" },
  { id: "input-form-submit", label: "Submit Workflow" },
  { id: "input-form-text", label: "Input" },
  { id: "input-form-textarea", label: "Multiline Input" },
  { id: "input-form-checkbox", label: "Checkbox" },
  { id: "input-form-dropdown", label: "Dropdown" },
  { id: "input-form-search", label: "Searchbox" },
  { id: "input-form-radio", label: "Radio Buttons" },
  { id: "input-form-slider", label: "Slider Input" },
  { id: "input-form-datetime", label: "Date/Time Picker" },
  { id: "input-form-image", label: "Picture Uploader" },
  { id: "input-form-file", label: "File Uploader" },
] as const;

const INPUT_FORM_BLOCK_IDS: Set<string> = new Set(INPUT_FORM_QUICK_BLOCKS.map((item) => item.id));

const CONTAINER_QUICK_BLOCKS = [
  { id: "container-group", label: "Group" },
  { id: "container-repeating-group", label: "Repeating Group" },
  { id: "container-popup", label: "Popup" },
  { id: "container-floating-group", label: "Floating Group" },
  { id: "container-group-focus", label: "Group Focus" },
  { id: "container-table", label: "Table" },
] as const;

const CONTAINER_BLOCK_IDS: Set<string> = new Set(CONTAINER_QUICK_BLOCKS.map((item) => item.id));

function normalizeBlockText(value: string): string {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, " ");
}

function formatDataPreviewCell(value: unknown): string {
  if (value === null || value === undefined || value === "") return "-";
  if (Array.isArray(value)) {
    return value
      .map((entry) => {
        if (entry === null || entry === undefined) return "";
        if (typeof entry === "object") return JSON.stringify(entry);
        return String(entry);
      })
      .filter(Boolean)
      .join(", ");
  }
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return "[object]";
    }
  }
  return String(value);
}

function getBlockId(block: any): string {
  return String(block?.getId?.() || block?.id || block?.get?.("id") || "");
}

function isInputFormBlockModel(block: any): boolean {
  return INPUT_FORM_BLOCK_IDS.has(getBlockId(block));
}

function isContainerBlockModel(block: any): boolean {
  return CONTAINER_BLOCK_IDS.has(getBlockId(block));
}

function getBlockSearchText(block: any): string {
  const labelRaw = String(block?.get?.("label") || "");
  const categoryRaw = String(block?.getCategoryLabel?.() || block?.get?.("category") || "");
  return normalizeBlockText(`${stripHtml(labelRaw)} ${stripHtml(categoryRaw)}`);
}

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

const EMPTY_SEO: SeoDraft = {
  title: "",
  description: "",
  ogTitle: "",
  ogDescription: "",
  ogImage: "",
};

const DEVICE_OPTIONS = [
  { id: "desktop", label: "Desktop" },
  { id: "tablet", label: "Tablet" },
  { id: "mobile", label: "Mobile" },
] as const;

const ADVANCED_STYLE_SECTORS: any[] = [
  {
    name: "Layout",
    open: true,
    properties: [
      {
        property: "display",
        type: "select",
        defaults: "block",
        options: [
          { id: "block", label: "Block" },
          { id: "inline-block", label: "Inline Block" },
          { id: "flex", label: "Flex" },
          { id: "grid", label: "Grid" },
          { id: "none", label: "Hidden" },
        ],
      },
      {
        property: "flex-direction",
        type: "radio",
        defaults: "row",
        options: [
          { id: "row", label: "Row" },
          { id: "column", label: "Column" },
        ],
      },
      {
        property: "justify-content",
        type: "select",
        options: [
          { id: "flex-start", label: "Start" },
          { id: "center", label: "Center" },
          { id: "flex-end", label: "End" },
          { id: "space-between", label: "Space Between" },
          { id: "space-around", label: "Space Around" },
        ],
      },
      {
        property: "align-items",
        type: "select",
        options: [
          { id: "stretch", label: "Stretch" },
          { id: "flex-start", label: "Start" },
          { id: "center", label: "Center" },
          { id: "flex-end", label: "End" },
        ],
      },
      "position",
      "top",
      "right",
      "left",
      "bottom",
    ],
  },
  {
    name: "Spacing & Size",
    open: false,
    properties: [
      "width",
      "height",
      "max-width",
      "min-height",
      "margin",
      "padding",
      {
        property: "gap",
        type: "slider",
        defaults: 0,
        step: 1,
        min: 0,
        max: 80,
        units: ["px", "rem"],
      },
    ],
  },
  {
    name: "Typography",
    open: false,
    properties: [
      {
        property: "font-size",
        type: "slider",
        defaults: 16,
        min: 8,
        max: 96,
        step: 1,
        units: ["px", "rem"],
      },
      {
        property: "font-weight",
        type: "select",
        options: [
          { id: "300", label: "Light" },
          { id: "400", label: "Regular" },
          { id: "500", label: "Medium" },
          { id: "600", label: "Semi Bold" },
          { id: "700", label: "Bold" },
          { id: "800", label: "Extra Bold" },
        ],
      },
      {
        property: "line-height",
        type: "slider",
        defaults: 1.5,
        min: 0.8,
        max: 3,
        step: 0.1,
        units: ["", "px", "em"],
      },
      "letter-spacing",
      "color",
      "text-align",
    ],
  },
  {
    name: "Border & Effects",
    open: false,
    properties: [
      "background-color",
      "border",
      {
        property: "border-radius",
        type: "slider",
        defaults: 0,
        min: 0,
        max: 80,
        step: 1,
        units: ["px", "%"],
      },
      "box-shadow",
      "opacity",
    ],
  },
];

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
  pageId,
  pageUpdatedAt,
  initialProjectData,
  initialHtml,
  initialCss,
  initialSeo,
  pageName,
  pageSlug,
  appId,
  onSave,
  onPublish,
}: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const canvasWrapRef = useRef<HTMLDivElement | null>(null);
  const floatingInspectorRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<any>(null);
  const autosaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const localBackupRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enforceIntervalRef = useRef<number | null>(null);
  const savingRef = useRef(false);
  const keyHandlerRef = useRef<((e: KeyboardEvent) => void) | null>(null);

  const [status, setStatus] = useState("Ready");
  const [isPublishing, setIsPublishing] = useState(false);
  const [isImageSelected, setIsImageSelected] = useState(false);
  const [activeDevice, setActiveDevice] = useState("desktop");
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [historyDepth, setHistoryDepth] = useState(0);
  const [appPages, setAppPages] = useState<AppPageItem[]>([]);
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [savedSnippets, setSavedSnippets] = useState<SavedSnippet[]>([]);
  const [selectedPageSlug, setSelectedPageSlug] = useState("");
  const [leftPanelMode, setLeftPanelMode] = useState<"builder" | "responsive">("builder");
  const [elementSearch, setElementSearch] = useState("");
  const [assetSearch, setAssetSearch] = useState("");
  const [seo, setSeo] = useState<SeoDraft>({ ...EMPTY_SEO, ...initialSeo });
  const [showFormBuilder, setShowFormBuilder] = useState(false);
  const [formWorkflowKey, setFormWorkflowKey] = useState("");
  const [appProjectId, setAppProjectId] = useState("");
  const [workspaceProjects, setWorkspaceProjects] = useState<WorkspaceProjectItem[]>([]);
  const [workspaceDatabases, setWorkspaceDatabases] = useState<WorkspaceDatabaseItem[]>([]);
  const [formDatabaseId, setFormDatabaseId] = useState("");
  const [databasePreviewRows, setDatabasePreviewRows] = useState<DatabasePreviewItem[]>([]);
  const [isDatabasePreviewLoading, setIsDatabasePreviewLoading] = useState(false);
  const [isCreatingFormDatabase, setIsCreatingFormDatabase] = useState(false);
  const [newDatabaseName, setNewDatabaseName] = useState("Form Submissions");
  const [showWorkflowDrawer, setShowWorkflowDrawer] = useState(false);
  const [workflowDrawerId, setWorkflowDrawerId] = useState("");
  const [workflowRuns, setWorkflowRuns] = useState<WorkflowRunItem[]>([]);
  const [runsLoading, setRunsLoading] = useState(false);
  const [runsError, setRunsError] = useState("");
  const [isRenamingWorkflow, setIsRenamingWorkflow] = useState(false);
  const [selectedRunId, setSelectedRunId] = useState("");
  const [isRunsPanelCollapsed, setIsRunsPanelCollapsed] = useState(false);
  const [formSubmitLabel, setFormSubmitLabel] = useState("Submit");
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false);
  const [showFloatingInspector, setShowFloatingInspector] = useState(false);
  const [floatingInspectorTab, setFloatingInspectorTab] = useState<"properties" | "styles">("properties");
  const [floatingInspectorPosition, setFloatingInspectorPosition] = useState<{ x: number; y: number } | null>(null);
  const [formFields, setFormFields] = useState<FormField[]>([
    {
      id: `field-${Date.now()}`,
      type: "email",
      name: "email",
      label: "Email",
      placeholder: "Enter your email",
      required: true,
      checked: false,
      options: "",
      min: "",
      max: "",
    },
  ]);

  const localDraftKey = useMemo(() => {
    if (!pageId) return "";
    return `nocode:draft:${pageId}`;
  }, [pageId]);

  const snippetsKey = useMemo(() => {
    if (!appId) return "";
    return `nocode:snippets:${appId}`;
  }, [appId]);

  const filteredSnippets = useMemo(() => {
    const query = assetSearch.trim().toLowerCase();
    if (!query) return savedSnippets;
    return savedSnippets.filter((item) => item.name.toLowerCase().includes(query));
  }, [assetSearch, savedSnippets]);

  const databasePreviewColumns = useMemo(() => {
    const keys = new Set<string>();
    databasePreviewRows.forEach((row) => {
      const values = row.values || {};
      Object.keys(values).forEach((key) => {
        if (!key.startsWith("__")) {
          keys.add(key);
        }
      });
    });

    const preferredOrder = ["title", "name", "email", "description", "message", "Status"];
    const orderedPreferred = preferredOrder.filter((key) => keys.has(key));
    const orderedRest = Array.from(keys).filter((key) => !preferredOrder.includes(key));
    return [...orderedPreferred, ...orderedRest].slice(0, 6);
  }, [databasePreviewRows]);

  const syncUndoState = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const um = editor.UndoManager as any;
    setCanUndo(Boolean(um?.hasUndo?.()));
    setCanRedo(Boolean(um?.hasRedo?.()));
    const stack = um?.getStack?.() || [];
    setHistoryDepth(Array.isArray(stack) ? stack.length : 0);
  }, []);

  const persistLocalSnapshot = useCallback(() => {
    const editor = editorRef.current;
    if (!editor || !localDraftKey) return;

    try {
      const snapshot = {
        grapesProjectData: editor.getProjectData(),
        html: editor.getHtml(),
        css: editor.getCss() || "",
        js: editor.getJs() || "",
        seo,
        savedAt: Date.now(),
      };
      window.localStorage.setItem(localDraftKey, JSON.stringify(snapshot));
    } catch {
      // Ignore local backup failures.
    }
  }, [localDraftKey, seo]);

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
      const createdStyle = frameDoc.createElement("style");
      createdStyle.id = fillStyleId;
      frameDoc.head?.appendChild(createdStyle);
      fillStyle = createdStyle;
    }
    if (!fillStyle) return;
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

      const snapshot = {
        grapesProjectData: editor.getProjectData(),
        html: editor.getHtml(),
        css: editor.getCss() || "",
        js: editor.getJs() || "",
        seo,
        savedAt: Date.now(),
      };

      if (localDraftKey) {
        try {
          window.localStorage.setItem(localDraftKey, JSON.stringify(snapshot));
        } catch {
          // Ignore local backup failures.
        }
      }

      await onSave({
        grapesProjectData: snapshot.grapesProjectData,
        html: snapshot.html,
        css: snapshot.css,
        js: snapshot.js,
        bindings: [],
        seo: snapshot.seo,
      });

      setStatus(`Draft saved at ${new Date().toLocaleTimeString()}`);
    } catch {
      setStatus("Save failed");
    } finally {
      savingRef.current = false;
    }
  }, [localDraftKey, onSave, seo]);

  const loadSavedSnippets = useCallback(() => {
    if (!snippetsKey) return;
    try {
      const raw = window.localStorage.getItem(snippetsKey);
      if (!raw) {
        setSavedSnippets([]);
        return;
      }

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        setSavedSnippets([]);
        return;
      }

      setSavedSnippets(parsed.filter((item) => item && typeof item === "object") as SavedSnippet[]);
    } catch {
      setSavedSnippets([]);
    }
  }, [snippetsKey]);

  const saveSnippets = useCallback((snippets: SavedSnippet[]) => {
    setSavedSnippets(snippets);
    if (!snippetsKey) return;
    try {
      window.localStorage.setItem(snippetsKey, JSON.stringify(snippets));
    } catch {
      // Ignore local save issues.
    }
  }, [snippetsKey]);

  const saveSelectedAsReusableComponent = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const selected = editor.getSelected();
    if (!selected) {
      setStatus("Select a section first");
      return;
    }

    const name = window.prompt("Reusable component name", "New Section");
    if (!name) return;

    const html = selected.toHTML?.() || "";
    if (!html.trim()) {
      setStatus("Unable to save this selection");
      return;
    }

    const next: SavedSnippet = {
      id: `snippet-${Date.now()}`,
      name: name.trim(),
      html,
      savedAt: Date.now(),
    };

    saveSnippets([next, ...savedSnippets].slice(0, 30));
    setStatus("Reusable component saved");
  }, [saveSnippets, savedSnippets]);

  const insertReusableComponent = useCallback((snippet: SavedSnippet) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.addComponents(snippet.html);
    setStatus(`Inserted ${snippet.name}`);
  }, []);

  const findNearestWorkflowBindableComponent = useCallback((component: any): any | null => {
    let current = component;
    while (current) {
      const tag = String(current?.get?.("tagName") || "").toLowerCase();
      if (tag === "form") return current;

      const attrs = (current?.getAttributes?.() || {}) as Record<string, unknown>;
      if (
        Object.prototype.hasOwnProperty.call(attrs, "data-workflow-scope")
        || Object.prototype.hasOwnProperty.call(attrs, "data-workflow-submit")
      ) {
        return current;
      }

      current = current?.parent?.();
    }
    return null;
  }, []);

  const syncWorkflowKeyFromSelectedBinding = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const selected = editor.getSelected?.();
    const bindable = findNearestWorkflowBindableComponent(selected);
    if (!bindable) return;

    const attrs = (bindable.getAttributes?.() || {}) as Record<string, unknown>;
    const key = String(attrs["data-workflow-key"] || "");
    setFormWorkflowKey(key);
    setFormDatabaseId(String(attrs["data-database-id"] || ""));

    const selectedProjectId = String(attrs["data-project-id"] || "");
    if (selectedProjectId) {
      setAppProjectId(selectedProjectId);
    }
  }, [findNearestWorkflowBindableComponent]);

  const applyWorkflowKeyToSelectedBinding = useCallback((workflowKey: string) => {
    const editor = editorRef.current;
    if (!editor) return false;

    const selected = editor.getSelected?.();
    const bindable = findNearestWorkflowBindableComponent(selected);
    if (!bindable) return false;

    const attrs = (bindable.getAttributes?.() || {}) as Record<string, unknown>;
    bindable.addAttributes({
      ...attrs,
      "data-workflow-key": workflowKey,
      "data-app-id": appId || String(attrs["data-app-id"] || ""),
      "data-project-id": appProjectId || String(attrs["data-project-id"] || ""),
      "data-database-id": formDatabaseId || String(attrs["data-database-id"] || ""),
      "data-workflow-alert": String(attrs["data-workflow-alert"] || "true"),
    });

    const tag = String(bindable?.get?.("tagName") || "").toLowerCase();
    const isTrigger = Object.prototype.hasOwnProperty.call(attrs, "data-workflow-submit");
    const targetLabel = tag === "form" ? "form" : (isTrigger ? "workflow trigger" : "workflow scope");

    setStatus(workflowKey ? `Assigned workflow ${workflowKey} to selected ${targetLabel}` : `Cleared selected ${targetLabel} workflow`);
    return true;
  }, [appId, appProjectId, findNearestWorkflowBindableComponent, formDatabaseId]);

  const applyDatabaseBindingToSelectedBinding = useCallback((databaseId: string, projectIdOverride?: string) => {
    const editor = editorRef.current;
    if (!editor) return false;

    const selected = editor.getSelected?.();
    const bindable = findNearestWorkflowBindableComponent(selected);
    if (!bindable) return false;

    const attrs = (bindable.getAttributes?.() || {}) as Record<string, unknown>;
    const nextProjectId = String(projectIdOverride || appProjectId || attrs["data-project-id"] || "");
    bindable.addAttributes({
      ...attrs,
      "data-database-id": databaseId,
      "data-project-id": nextProjectId,
      "data-app-id": appId || String(attrs["data-app-id"] || ""),
      "data-workflow-alert": String(attrs["data-workflow-alert"] || "true"),
    });

    const tag = String(bindable?.get?.("tagName") || "").toLowerCase();
    const isTrigger = Object.prototype.hasOwnProperty.call(attrs, "data-workflow-submit");
    const targetLabel = tag === "form" ? "form" : (isTrigger ? "workflow trigger" : "workflow scope");

    setStatus(databaseId ? `Bound database to selected ${targetLabel}` : `Cleared selected ${targetLabel} database binding`);
    return true;
  }, [appId, appProjectId, findNearestWorkflowBindableComponent]);

  const renderBlockPanels = useCallback((searchQuery: string) => {
    const editor = editorRef.current;
    const visualContainer = document.getElementById("gjs-blocks");
    const containerBlocksContainer = document.getElementById("gjs-container-blocks");
    const inputFormsContainer = document.getElementById("gjs-input-form-blocks");

    if (!editor || !visualContainer || !containerBlocksContainer || !inputFormsContainer) return;

    const bm = editor.BlockManager;
    const collection = bm?.getAll?.();
    const allBlocks = Array.isArray(collection)
      ? collection
      : collection?.toArray?.() || collection?.models || [];

    const visualBlocks = allBlocks.filter((block: any) => !isInputFormBlockModel(block) && !isContainerBlockModel(block));
    const containerBlocks = allBlocks.filter((block: any) => isContainerBlockModel(block));
    const inputFormBlocks = allBlocks.filter((block: any) => isInputFormBlockModel(block));
    const normalizedQuery = normalizeBlockText(searchQuery);

    const filteredVisualBlocks = !normalizedQuery
      ? visualBlocks
      : visualBlocks.filter((block: any) => getBlockSearchText(block).includes(normalizedQuery));

    const filteredContainerBlocks = !normalizedQuery
      ? containerBlocks
      : containerBlocks.filter((block: any) => getBlockSearchText(block).includes(normalizedQuery));

    bm.render(filteredVisualBlocks);

    const containerBlocksEl = bm.render(filteredContainerBlocks, { external: true } as any);
    containerBlocksContainer.innerHTML = "";
    if (containerBlocksEl) {
      containerBlocksContainer.appendChild(containerBlocksEl);
    }

    const inputBlocksEl = bm.render(inputFormBlocks, { external: true } as any);
    inputFormsContainer.innerHTML = "";
    if (inputBlocksEl) {
      inputFormsContainer.appendChild(inputBlocksEl);
    }
  }, []);

  const linkSelectedElement = useCallback((slug: string) => {
    const editor = editorRef.current;
    if (!editor || !slug) return;

    const selected = editor.getSelected();
    if (!selected) {
      setStatus("Select a button or link first");
      return;
    }

    const tag = String(selected.get("tagName") || "").toLowerCase();
    if (!["a", "button"].includes(tag)) {
      setStatus("Select a link or button to connect a page");
      return;
    }

    const href = `/p/${slug}`;
    selected.addAttributes({ href });
    if (tag === "button") {
      selected.set("tagName", "a");
      selected.addAttributes({ role: "button", href });
    }
    setStatus(`Linked to /p/${slug}`);
  }, []);

  const createWorkflowFromBuilder = useCallback(async () => {
    if (!appId) {
      setStatus("Save the page/app first to create workflows");
      return;
    }

    try {
      setStatus("Creating workflow...");
      const res = await fetch("/api/nocode/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appId, name: `${pageName || "Page"} Workflow` }),
      });

      if (!res.ok) {
        throw new Error(`Failed to create workflow (${res.status})`);
      }

      const json = await res.json();
      const created = json?.data;
      const createdId = String(created?._id || "");
      const createdKey = String(created?.key || "");
      const createdName = String(created?.name || "Untitled");

      if (createdKey) {
        setFormWorkflowKey(createdKey);
        applyWorkflowKeyToSelectedBinding(createdKey);
      }

      if (createdId && createdKey) {
        setWorkflows((prev) => {
          const next = [{ _id: createdId, key: createdKey, name: createdName, status: "draft" }, ...prev];
          const seen = new Set<string>();
          return next.filter((item) => {
            if (seen.has(item._id)) return false;
            seen.add(item._id);
            return true;
          });
        });
      }

      if (createdId) {
        await runSave();
        setWorkflowDrawerId(createdId);
        setShowWorkflowDrawer(true);
      }
      setStatus("Workflow created");
    } catch {
      setStatus("Failed to create workflow");
    }
  }, [appId, applyWorkflowKeyToSelectedBinding, pageName, runSave]);

  const openSelectedWorkflowFromBuilder = useCallback(async () => {
    let activeKey = formWorkflowKey;
    const editor = editorRef.current;
    if (editor) {
      const selectedComponent = editor.getSelected?.();
      const selectedBindable = findNearestWorkflowBindableComponent(selectedComponent);
      if (selectedBindable) {
        const attrs = (selectedBindable.getAttributes?.() || {}) as Record<string, unknown>;
        activeKey = String(attrs["data-workflow-key"] || "");
      }
    }

    const selected = workflows.find((wf) => wf.key === activeKey) || workflows.find((wf) => wf.key === formWorkflowKey) || workflows[0];
    if (!selected?._id) {
      setStatus("No workflow available to open");
      return;
    }

    await runSave();
    setWorkflowDrawerId(selected._id);
    setShowWorkflowDrawer(true);
  }, [findNearestWorkflowBindableComponent, formWorkflowKey, runSave, workflows]);

  const createFormDatabaseFromBuilder = useCallback(async () => {
    if (!appProjectId) {
      setStatus("Select a project before creating a table");
      return;
    }

    try {
      setIsCreatingFormDatabase(true);
      const res = await fetch("/api/databases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: appProjectId,
          name: String(newDatabaseName || "Form Submissions"),
          icon: "🧾",
          viewType: "board",
          templateName: "blank",
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to create table (${res.status})`);
      }

      const created = await res.json();
      const createdId = String(created?._id || "");
      if (!createdId) {
        throw new Error("Database id missing in create response");
      }

      setWorkspaceDatabases((prev) => {
        const exists = prev.some((db) => db._id === createdId);
        if (exists) return prev;
        return [
          {
            _id: createdId,
            name: String(created?.name || newDatabaseName || "Form Submissions"),
            viewType: String(created?.viewType || "board"),
          },
          ...prev,
        ];
      });

      setFormDatabaseId(createdId);
      const applied = applyDatabaseBindingToSelectedBinding(createdId, appProjectId);
      if (!applied) {
        setStatus("Table created. Select a form or workflow scope to bind it.");
      } else {
        setStatus("Table created and bound to selected form element");
      }
    } catch {
      setStatus("Failed to create table");
    } finally {
      setIsCreatingFormDatabase(false);
    }
  }, [appProjectId, applyDatabaseBindingToSelectedBinding, newDatabaseName]);

  const fetchDatabasePreviewRows = useCallback(async () => {
    if (!formDatabaseId) {
      setDatabasePreviewRows([]);
      return;
    }

    try {
      setIsDatabasePreviewLoading(true);
      const res = await fetch(`/api/board_items?databaseId=${formDatabaseId}`, { cache: "no-store" });
      if (!res.ok) {
        setDatabasePreviewRows([]);
        return;
      }

      const list = await res.json();
      const mapped = (Array.isArray(list) ? list : [])
        .slice(0, 10)
        .map((item: any) => ({
          _id: String(item?._id || ""),
          values: item?.values && typeof item.values === "object" ? item.values : {},
          createdAt: item?.createdAt ? String(item.createdAt) : "",
        }));

      setDatabasePreviewRows(mapped);
    } catch {
      setDatabasePreviewRows([]);
    } finally {
      setIsDatabasePreviewLoading(false);
    }
  }, [formDatabaseId]);

  const addFormField = useCallback(() => {
    setFormFields((prev) => [
      ...prev,
      {
        id: `field-${Date.now()}-${prev.length}`,
        type: "text",
        name: `field_${prev.length + 1}`,
        label: "Field",
        placeholder: "",
        required: false,
        checked: false,
        options: "Option 1, Option 2, Option 3",
        min: "",
        max: "",
      },
    ]);
  }, []);

  const buildFormHtml = useCallback(() => {
    const fieldsHtml = formFields.map((field) => {
      const requiredAttr = field.required ? " required" : "";
      const minAttr = field.min.trim() ? ` min=\"${field.min.trim()}\"` : "";
      const maxAttr = field.max.trim() ? ` max=\"${field.max.trim()}\"` : "";
      const label = field.label.trim() || field.name;
      const placeholderAttr = field.placeholder.trim()
        ? ` placeholder=\"${field.placeholder.trim()}\"`
        : "";

      const optionValues = field.options
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      if (field.type === "select") {
        const optionsHtml = (optionValues.length ? optionValues : ["Option 1", "Option 2"]).map((option) => (
          `<option value=\"${option}\">${option}</option>`
        )).join("");
        return `<label style=\"display:flex;flex-direction:column;gap:6px;font-weight:600;color:#1e293b;\">${label}<select name=\"${field.name}\"${requiredAttr} style=\"padding:10px;border:1px solid #cbd5e1;border-radius:8px;background:#fff;\">${optionsHtml}</select></label>`;
      }

      if (field.type === "radio") {
        const options = optionValues.length ? optionValues : ["Option 1", "Option 2"];
        const radioHtml = options.map((option, index) => {
          const checkedAttr = field.checked && index === 0 ? " checked" : "";
          const requiredForGroup = field.required && index === 0 ? " required" : "";
          return `<label style=\"display:flex;align-items:center;gap:8px;font-weight:500;color:#1e293b;\"><input type=\"radio\" name=\"${field.name}\" value=\"${option}\"${requiredForGroup}${checkedAttr} style=\"width:16px;height:16px;\"/>${option}</label>`;
        }).join("");
        return `<fieldset style=\"display:flex;flex-direction:column;gap:8px;border:1px solid #cbd5e1;border-radius:10px;padding:10px;\"><legend style=\"padding:0 6px;font-weight:600;color:#1e293b;\">${label}</legend>${radioHtml}</fieldset>`;
      }

      if (field.type === "checkbox") {
        const checkedAttr = field.checked ? " checked" : "";
        return `<label style=\"display:flex;align-items:center;gap:8px;font-weight:600;color:#1e293b;\"><input type=\"checkbox\" name=\"${field.name}\"${requiredAttr}${checkedAttr} style=\"width:16px;height:16px;\" />${label}</label>`;
      }

      if (field.type === "textarea") {
        return `<label style=\"display:flex;flex-direction:column;gap:6px;font-weight:600;color:#1e293b;\">${label}<textarea name=\"${field.name}\"${placeholderAttr}${requiredAttr}${minAttr}${maxAttr} style=\"padding:10px;border:1px solid #cbd5e1;border-radius:8px;min-height:96px;\"></textarea></label>`;
      }

      if (field.type === "image") {
        return `<label style=\"display:flex;flex-direction:column;gap:6px;font-weight:600;color:#1e293b;\">${label}<input type=\"file\" name=\"${field.name}\" accept=\"image/*\"${requiredAttr} style=\"padding:10px;border:1px solid #cbd5e1;border-radius:8px;background:#fff;\" /></label>`;
      }

      if (field.type === "file") {
        return `<label style=\"display:flex;flex-direction:column;gap:6px;font-weight:600;color:#1e293b;\">${label}<input type=\"file\" name=\"${field.name}\"${requiredAttr} style=\"padding:10px;border:1px solid #cbd5e1;border-radius:8px;background:#fff;\" /></label>`;
      }

      if (field.type === "range") {
        const rangeMin = field.min.trim() || "0";
        const rangeMax = field.max.trim() || "100";
        return `<label style=\"display:flex;flex-direction:column;gap:8px;font-weight:600;color:#1e293b;\">${label}<input type=\"range\" name=\"${field.name}\" min=\"${rangeMin}\" max=\"${rangeMax}\"${requiredAttr} style=\"width:100%;\" /></label>`;
      }

      return `<label style=\"display:flex;flex-direction:column;gap:6px;font-weight:600;color:#1e293b;\">${label}<input type=\"${field.type}\" name=\"${field.name}\"${placeholderAttr}${requiredAttr}${minAttr}${maxAttr} style=\"padding:10px;border:1px solid #cbd5e1;border-radius:8px;\" /></label>`;
    }).join("");

    return `<form data-workflow-key=\"${formWorkflowKey}\" data-app-id=\"${appId || ""}\" data-project-id=\"${appProjectId || ""}\" data-database-id=\"${formDatabaseId || ""}\" data-workflow-alert=\"true\" style=\"display:flex;flex-direction:column;gap:12px;padding:18px;border:1px solid #cbd5e1;border-radius:12px;background:#ffffff;\">${fieldsHtml}<button type=\"submit\" style=\"padding:10px 14px;border:none;border-radius:8px;background:#2563eb;color:#fff;font-weight:700;cursor:pointer;\">${formSubmitLabel || "Submit"}</button></form>`;
  }, [appId, appProjectId, formDatabaseId, formFields, formSubmitLabel, formWorkflowKey]);

  const insertBuiltForm = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.addComponents(buildFormHtml());
    setShowFormBuilder(false);
    setStatus("Custom form inserted");
  }, [buildFormHtml]);

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

  const selectedWorkflow = useMemo(() => {
    return workflows.find((wf) => wf.key === formWorkflowKey) || workflows[0] || null;
  }, [formWorkflowKey, workflows]);

  const renameWorkflowFromDrawer = useCallback(async () => {
    if (!workflowDrawerId) {
      setStatus("Open a workflow first");
      return;
    }

    const current = workflows.find((wf) => wf._id === workflowDrawerId);
    const currentName = String(current?.name || "Workflow");
    const nextNameInput = window.prompt("Enter new workflow name", currentName);
    if (nextNameInput === null) return;

    const nextName = nextNameInput.trim();
    if (!nextName) {
      window.alert("Workflow name cannot be empty.");
      return;
    }

    if (nextName === currentName) return;

    try {
      setIsRenamingWorkflow(true);
      const res = await fetch(`/api/nocode/workflows/${workflowDrawerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nextName }),
      });

      if (!res.ok) {
        throw new Error(`Rename failed (${res.status})`);
      }

      const json = await res.json();
      const updated = json?.data;

      setWorkflows((prev) => prev.map((wf) => (
        wf._id === workflowDrawerId
          ? {
            ...wf,
            name: String(updated?.name || nextName),
            status: String(updated?.status || wf.status),
            updatedAt: updated?.updatedAt ? String(updated.updatedAt) : wf.updatedAt,
          }
          : wf
      )));

      setStatus(`Workflow renamed to ${String(updated?.name || nextName)}`);
    } catch {
      setStatus("Failed to rename workflow");
      window.alert("Failed to rename workflow");
    } finally {
      setIsRenamingWorkflow(false);
    }
  }, [workflowDrawerId, workflows]);

  const selectedRun = useMemo(() => {
    return workflowRuns.find((run) => run._id === selectedRunId) || workflowRuns[0] || null;
  }, [selectedRunId, workflowRuns]);

  const fetchWorkflowRuns = useCallback(async () => {
    if (!appId) return;

    try {
      setRunsLoading(true);
      setRunsError("");

      const res = await fetch(`/api/nocode/runs?appId=${appId}`, { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`Failed to load runs (${res.status})`);
      }

      const json = await res.json();
      const list = Array.isArray(json?.data) ? json.data : [];
      const filteredByWorkflow = list.filter((item: any) => String(item?.workflowId || "") === String(workflowDrawerId || ""));

      const mapped = filteredByWorkflow.map((item: any) => ({
        _id: String(item?._id || ""),
        workflowId: String(item?.workflowId || ""),
        status: String(item?.status || ""),
        error: String(item?.error || ""),
        createdAt: item?.createdAt ? String(item.createdAt) : "",
        finishedAt: item?.finishedAt ? String(item.finishedAt) : "",
        triggerType: String(item?.triggerType || ""),
        stepLogs: Array.isArray(item?.stepLogs) ? item.stepLogs : [],
      }));

      setWorkflowRuns(mapped);
      setSelectedRunId((prev) => {
        if (prev && mapped.some((run: WorkflowRunItem) => run._id === prev)) return prev;
        return mapped[0]?._id || "";
      });
    } catch (error) {
      setRunsError(error instanceof Error ? error.message : "Failed to load runs");
    } finally {
      setRunsLoading(false);
    }
  }, [appId, workflowDrawerId]);

  useEffect(() => {
    if (!showWorkflowDrawer || !workflowDrawerId || !appId) return;

    void fetchWorkflowRuns();
    const poll = window.setInterval(() => {
      void fetchWorkflowRuns();
    }, 5000);

    return () => {
      window.clearInterval(poll);
    };
  }, [appId, fetchWorkflowRuns, showWorkflowDrawer, workflowDrawerId]);

  useEffect(() => {
    if (!rootRef.current || editorRef.current) return;

    let cancelled = false;

    const setup = async () => {
      await import("grapesjs/dist/css/grapes.min.css");
      const grapesModule = await import("grapesjs");
      if (cancelled) return;

      const grapesjs = grapesModule.default;
      const container = rootRef.current;
      if (!container) return;
      const editor = grapesjs.init({
      container,
      fromElement: false,
      height: "100%",
      width: "auto",
      storageManager: false,
      deviceManager: {
        devices: [
          { id: "desktop", name: "Desktop", width: "" },
          { id: "tablet", name: "Tablet", width: "768px", widthMedia: "992px" },
          { id: "mobile", name: "Mobile", width: "375px", widthMedia: "576px" },
        ],
      },
      panels: { defaults: [] },
      blockManager: {
        appendTo: "#gjs-blocks",
      },
      styleManager: {
        appendTo: "#gjs-styles",
        sectors: ADVANCED_STYLE_SECTORS,
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

      editor.Commands.add("wb-popup-toggle", {
      run(ed) {
        const component = ed.getSelected();
        if (!component) return;

        const attrs = (component.getAttributes?.() || {}) as Record<string, string>;
        const currentState = String(attrs["data-popup-state"] || "closed");
        const nextState = currentState === "open" ? "closed" : "open";
        const triggerId = window.prompt("Trigger element ID (button/link element to toggle this popup):", String(attrs["data-popup-trigger"] || ""));
        
        if (triggerId !== null) {
          component.addAttributes({
            "data-popup-state": nextState,
            "data-popup-trigger": triggerId || "",
          });
          setStatus(`Popup configured: trigger=${triggerId || "(none)"}, state=${nextState}`);
        }
      },
    });

      editor.Commands.add("wb-repeating-config", {
      run(ed) {
        const component = ed.getSelected();
        if (!component) return;

        const attrs = (component.getAttributes?.() || {}) as Record<string, string>;
        const currentSource = String(attrs["data-repeating-source"] || "");
        const nextSource = window.prompt("Data source (API endpoint or data key):", currentSource);
        
        if (nextSource !== null) {
          component.addAttributes({
            "data-repeating-source": nextSource || "",
            "data-repeating-item": String(attrs["data-repeating-item"] || "item"),
          });
          setStatus(`Repeating group configured: ${nextSource || "(manual)"} `);
        }
      },
    });

      editor.Commands.add("wb-table-columns", {
      run(ed) {
        const component = ed.getSelected();
        if (!component) return;

        const attrs = (component.getAttributes?.() || {}) as Record<string, string>;
        const currentCols = String(attrs["data-table-columns"] || "Name,Role,Status");
        const nextCols = window.prompt("Column names (comma-separated):", currentCols);
        
        if (nextCols !== null) {
          const colArray = nextCols.split(",").map(c => c.trim()).filter(Boolean);
          component.addAttributes({
            "data-table-columns": colArray.join(","),
            "data-table-source": String(attrs["data-table-source"] || ""),
          });
          setStatus(`Table columns configured: ${colArray.join(", ")}`);
        }
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

      const containerType = String(component.get("attributes")?.["data-container-type"] || "");
      if (containerType === "popup" && !toolbar.some((t: any) => t?.command === "wb-popup-toggle")) {
        toolbar.unshift({
          attributes: { class: "fa fa-compress", title: "Configure popup" },
          command: "wb-popup-toggle",
        });
      }

      if (containerType === "repeating-group" && !toolbar.some((t: any) => t?.command === "wb-repeating-config")) {
        toolbar.unshift({
          attributes: { class: "fa fa-repeat", title: "Configure data source" },
          command: "wb-repeating-config",
        });
      }

      if (containerType === "table" && !toolbar.some((t: any) => t?.command === "wb-table-columns")) {
        toolbar.unshift({
          attributes: { class: "fa fa-th", title: "Edit columns" },
          command: "wb-table-columns",
        });
      }

      component.set("toolbar", toolbar);
    };

      editor.on("component:selected", (component: any) => {
      if (!component) return;
      applyEditToolbar(component);

      const tag = String(component.get("tagName") || "").toLowerCase();
      const containerType = String(component.get("attributes")?.["data-container-type"] || "");
      
      setIsImageSelected(tag === "img");
      setShowFloatingInspector(true);
      
      if (tag === "img") {
        component.set("traits", ["alt", { type: "text", name: "src", label: "Image URL" }]);
      }

      if (containerType === "popup") {
        component.set("traits", [
          { type: "text", name: "data-popup-trigger", label: "Trigger Element ID" },
          { type: "text", name: "data-popup-state", label: "State (open/closed)" },
        ]);
      }

      if (containerType === "repeating-group") {
        component.set("traits", [
          { type: "text", name: "data-repeating-source", label: "Data Source" },
          { type: "text", name: "data-repeating-item", label: "Item Variable Name" },
        ]);
      }

      if (containerType === "table") {
        component.set("traits", [
          { type: "text", name: "data-table-columns", label: "Columns (comma-separated)" },
          { type: "text", name: "data-table-source", label: "Data Source" },
        ]);
      }

      syncWorkflowKeyFromSelectedBinding();
    });

      editor.on("component:dblclick", (component: any) => {
      const tag = String(component?.get?.("tagName") || "").toLowerCase();
      editor.select(component);
      setShowFloatingInspector(true);

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
      setShowFloatingInspector(false);
    });

    const visualLabel = (icon: string, text: string) =>
      `<span class="wb-visual-block-label"><span class="wb-visual-block-icon">${icon}</span><span>${text}</span></span>`;

    const containerAttributes = { "data-container-managed": "true" };

    editor.BlockManager.add("visual-text", {
      label: visualLabel("T", "Text"),
      content: '<p style="margin:0;font-size:16px;line-height:1.6;">Add your text here.</p>',
    });

    editor.BlockManager.add("visual-button", {
      label: visualLabel("[ ]", "Button"),
      content: '<a class="wb-btn" href="#">Button</a>',
    });

    editor.BlockManager.add("visual-icon", {
      label: visualLabel("*", "Icon"),
      content: '<span style="display:inline-flex;align-items:center;justify-content:center;width:42px;height:42px;border:1px solid #cbd5e1;border-radius:10px;font-size:22px;line-height:1;">*</span>',
    });

    editor.BlockManager.add("visual-link", {
      label: visualLabel("@", "Link"),
      content: '<a href="#" style="color:#2563eb;text-decoration:underline;font-weight:600;">Open link</a>',
    });

    editor.BlockManager.add("visual-image", {
      label: visualLabel("IMG", "Image"),
      content:
        '<img src="https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop" alt="placeholder" style="max-width:100%;border-radius:14px;"/>',
    });

    editor.BlockManager.add("visual-shape", {
      label: visualLabel("[]", "Shape"),
      content: '<div style="width:140px;height:90px;border-radius:14px;background:#dbeafe;border:1px solid #93c5fd;"></div>',
    });

    editor.BlockManager.add("visual-alert", {
      label: visualLabel("!", "Alert"),
      content: '<div role="alert" style="padding:12px 14px;border-radius:12px;border:1px solid #fcd34d;background:#fef3c7;color:#92400e;font-weight:600;">Important alert message</div>',
    });

    editor.BlockManager.add("visual-video", {
      label: visualLabel("VID", "Video"),
      content:
        '<div style="position:relative;width:100%;padding-top:56.25%;border-radius:12px;overflow:hidden;background:#0f172a;"><iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" title="Video" allowfullscreen style="position:absolute;inset:0;width:100%;height:100%;border:0;"></iframe></div>',
    });

    editor.BlockManager.add("visual-html", {
      label: visualLabel("</>", "HTML"),
      content: '<div style="border:1px dashed #94a3b8;border-radius:10px;padding:12px;"><h3 style="margin:0 0 6px;">HTML Block</h3><p style="margin:0;">Edit this block as custom HTML content.</p></div>',
    });

    editor.BlockManager.add("visual-map", {
      label: visualLabel("MAP", "Map"),
      content:
        '<div style="border-radius:12px;overflow:hidden;border:1px solid #cbd5e1;"><iframe title="Map" src="https://maps.google.com/maps?q=New%20York&t=&z=13&ie=UTF8&iwloc=&output=embed" style="width:100%;height:260px;border:0;"></iframe></div>',
    });

    editor.BlockManager.add("visual-navbar", {
      label: visualLabel("NAV", "Navbar"),
      content:
        '<nav class="wb-navbar"><div class="wb-brand">Brand</div><div class="wb-nav-links"><a href="#">Home</a><a href="#">About</a><a href="#">Contact</a></div></nav>',
    });

    editor.BlockManager.add("visual-hero", {
      label: visualLabel("H", "Hero"),
      content:
        '<section class="wb-hero"><h1>Hero title</h1><p>Hero subtitle</p><a class="wb-btn" href="#">Get Started</a></section>',
    });

    editor.BlockManager.add("visual-form", {
      label: visualLabel("F", "Form"),
      content:
        `<form data-workflow-key="" data-app-id="${appId || ""}" data-project-id="" data-database-id="" data-workflow-alert="true" style="display:flex;gap:8px;flex-wrap:wrap;padding:16px;background:#fff;border:1px solid #cbd5e1;border-radius:12px;"><input name="email" type="email" placeholder="Email" required style="flex:1;min-width:180px;padding:10px;border:1px solid #cbd5e1;border-radius:8px;"/><button type="submit" style="padding:10px 14px;border:none;border-radius:8px;background:#2563eb;color:#fff;font-weight:600;">Submit</button></form>`,
    });

    editor.BlockManager.add("container-group", {
      label: visualLabel("G", "Group"),
      attributes: containerAttributes,
      content: '<div data-container-type="group" style="min-height:120px;padding:16px;border:1px solid #cbd5e1;border-radius:12px;background:#ffffff;"><h4 style="margin:0 0 8px;color:#0f172a;">Group</h4><p style="margin:0;color:#475569;">Drop elements inside this group.</p></div>',
    });

    editor.BlockManager.add("container-repeating-group", {
      label: visualLabel("RG", "Repeating Group"),
      attributes: containerAttributes,
      content: '<section data-container-type="repeating-group" data-repeating-source="" data-repeating-item="item" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;padding:14px;border:1px dashed #94a3b8;border-radius:12px;background:#f8fafc;"><article style="padding:12px;border:1px solid #cbd5e1;border-radius:10px;background:#fff;"><strong style="display:block;margin-bottom:4px;">Item 1</strong><span style="color:#64748b;">Repeating content</span></article><article style="padding:12px;border:1px solid #cbd5e1;border-radius:10px;background:#fff;"><strong style="display:block;margin-bottom:4px;">Item 2</strong><span style="color:#64748b;">Repeating content</span></article></section>',
    });

    editor.BlockManager.add("container-popup", {
      label: visualLabel("P", "Popup"),
      attributes: containerAttributes,
      content: '<div data-container-type="popup" data-popup-state="closed" data-popup-trigger="" style="position:relative;padding:12px;border:1px dashed #94a3b8;border-radius:12px;background:#f8fafc;"><div style="position:relative;max-width:360px;margin:0 auto;padding:16px;border-radius:12px;background:#ffffff;border:1px solid #cbd5e1;box-shadow:0 12px 30px rgba(15,23,42,0.12);"><h4 style="margin:0 0 8px;color:#0f172a;">Popup</h4><p style="margin:0 0 12px;color:#475569;">Use this as a modal content container.</p><button type="button" style="padding:8px 12px;border:none;border-radius:8px;background:#2563eb;color:#fff;font-weight:600;">Primary action</button></div></div>',
    });

    editor.BlockManager.add("container-floating-group", {
      label: visualLabel("FG", "Floating Group"),
      attributes: containerAttributes,
      content: '<div data-container-type="floating-group" style="position:relative;min-height:180px;padding:14px;border:1px dashed #94a3b8;border-radius:12px;background:#f8fafc;"><div style="position:absolute;right:14px;bottom:14px;min-width:180px;padding:12px;border:1px solid #cbd5e1;border-radius:10px;background:#fff;box-shadow:0 10px 24px rgba(15,23,42,0.14);"><strong style="display:block;margin-bottom:6px;color:#0f172a;">Floating Group</strong><span style="color:#64748b;">Pinned utility panel</span></div></div>',
    });

    editor.BlockManager.add("container-group-focus", {
      label: visualLabel("GF", "Group Focus"),
      attributes: containerAttributes,
      content: '<div data-container-type="group-focus" style="position:relative;min-height:150px;padding:14px;border:1px solid #cbd5e1;border-radius:12px;background:#ffffff;"><div style="padding:12px;border:1px solid #e2e8f0;border-radius:10px;background:#f8fafc;"><strong style="display:block;color:#0f172a;">Focused Group</strong><span style="color:#64748b;">Anchor target element</span></div><div style="position:absolute;left:24px;top:102px;padding:10px 12px;border-radius:10px;background:#0f172a;color:#e2e8f0;box-shadow:0 8px 20px rgba(15,23,42,0.22);">Group focus content</div></div>',
    });

    editor.BlockManager.add("container-table", {
      label: visualLabel("TB", "Table"),
      attributes: containerAttributes,
      content: '<div data-container-type="table" data-table-columns="Name,Role,Status" data-table-source="" style="overflow:auto;border:1px solid #cbd5e1;border-radius:12px;background:#fff;"><table style="width:100%;border-collapse:collapse;min-width:420px;"><thead><tr><th style="text-align:left;padding:10px;background:#f8fafc;border-bottom:1px solid #cbd5e1;">Name</th><th style="text-align:left;padding:10px;background:#f8fafc;border-bottom:1px solid #cbd5e1;">Role</th><th style="text-align:left;padding:10px;background:#f8fafc;border-bottom:1px solid #cbd5e1;">Status</th></tr></thead><tbody><tr><td style="padding:10px;border-bottom:1px solid #e2e8f0;">Alex</td><td style="padding:10px;border-bottom:1px solid #e2e8f0;">Designer</td><td style="padding:10px;border-bottom:1px solid #e2e8f0;">Active</td></tr><tr><td style="padding:10px;">Jordan</td><td style="padding:10px;">Developer</td><td style="padding:10px;">Paused</td></tr></tbody></table></div>',
    });

    const inputFormsCategory = "Input forms";
    const inputFormBlockAttributes = { "data-input-form-block": "true" };

    editor.BlockManager.add("input-form-workflow-scope", {
      label: visualLabel("WS", "Workflow Scope"),
      category: inputFormsCategory,
      attributes: inputFormBlockAttributes,
      content: `<section data-workflow-scope="true" data-workflow-key="" data-app-id="${appId || ""}" data-project-id="" data-database-id="" data-workflow-alert="true" style="display:flex;flex-direction:column;gap:10px;padding:14px;border:1px dashed #94a3b8;border-radius:12px;background:#f8fafc;"><h4 style="margin:0;color:#0f172a;">Workflow Scope</h4><label style="display:flex;flex-direction:column;gap:6px;font-weight:600;color:#1e293b;">Email<input type="email" name="email" data-field-key="email" placeholder="name@example.com" style="padding:10px;border:1px solid #cbd5e1;border-radius:8px;background:#fff;"/></label><button type="button" data-workflow-submit="true" style="padding:10px 14px;border:none;border-radius:8px;background:#2563eb;color:#fff;font-weight:700;cursor:pointer;">Submit Workflow</button></section>`,
    });

    editor.BlockManager.add("input-form-submit", {
      label: visualLabel("SB", "Submit Workflow"),
      category: inputFormsCategory,
      attributes: inputFormBlockAttributes,
      content: '<button type="button" data-workflow-submit="true" data-workflow-key="" data-app-id="" data-project-id="" data-database-id="" data-workflow-alert="true" style="padding:10px 14px;border:none;border-radius:8px;background:#2563eb;color:#fff;font-weight:700;cursor:pointer;">Submit Workflow</button>',
    });

    editor.BlockManager.add("input-form-text", {
      label: visualLabel("I", "Input"),
      category: inputFormsCategory,
      attributes: inputFormBlockAttributes,
      content: '<label style="display:flex;flex-direction:column;gap:6px;font-weight:600;color:#1e293b;">Input<input type="text" name="input" data-field-key="input" placeholder="Type here" style="padding:10px;border:1px solid #cbd5e1;border-radius:8px;"/></label>',
    });

    editor.BlockManager.add("input-form-textarea", {
      label: visualLabel("M", "Multiline Input"),
      category: inputFormsCategory,
      attributes: inputFormBlockAttributes,
      content: '<label style="display:flex;flex-direction:column;gap:6px;font-weight:600;color:#1e293b;">Multiline Input<textarea name="message" data-field-key="message" placeholder="Type message" style="padding:10px;border:1px solid #cbd5e1;border-radius:8px;min-height:96px;"></textarea></label>',
    });

    editor.BlockManager.add("input-form-checkbox", {
      label: visualLabel("C", "Checkbox"),
      category: inputFormsCategory,
      attributes: inputFormBlockAttributes,
      content: '<label style="display:flex;align-items:center;gap:8px;font-weight:600;color:#1e293b;"><input type="checkbox" name="checkbox" data-field-key="checkbox" style="width:16px;height:16px;"/>Checkbox</label>',
    });

    editor.BlockManager.add("input-form-dropdown", {
      label: visualLabel("D", "Dropdown"),
      category: inputFormsCategory,
      attributes: inputFormBlockAttributes,
      content: '<label style="display:flex;flex-direction:column;gap:6px;font-weight:600;color:#1e293b;">Dropdown<select name="dropdown" data-field-key="dropdown" style="padding:10px;border:1px solid #cbd5e1;border-radius:8px;background:#fff;"><option value="option-1">Option 1</option><option value="option-2">Option 2</option></select></label>',
    });

    editor.BlockManager.add("input-form-search", {
      label: visualLabel("S", "Searchbox"),
      category: inputFormsCategory,
      attributes: inputFormBlockAttributes,
      content: '<label style="display:flex;flex-direction:column;gap:6px;font-weight:600;color:#1e293b;">Searchbox<input type="search" name="search" data-field-key="search" placeholder="Search..." style="padding:10px;border:1px solid #cbd5e1;border-radius:8px;"/></label>',
    });

    editor.BlockManager.add("input-form-radio", {
      label: visualLabel("R", "Radio Buttons"),
      category: inputFormsCategory,
      attributes: inputFormBlockAttributes,
      content: '<fieldset style="display:flex;flex-direction:column;gap:8px;border:1px solid #cbd5e1;border-radius:10px;padding:10px;"><legend style="padding:0 6px;font-weight:600;color:#1e293b;">Radio Buttons</legend><label style="display:flex;align-items:center;gap:8px;color:#1e293b;"><input type="radio" name="radio" data-field-key="radio" value="option-1" checked/>Option 1</label><label style="display:flex;align-items:center;gap:8px;color:#1e293b;"><input type="radio" name="radio" data-field-key="radio" value="option-2"/>Option 2</label></fieldset>',
    });

    editor.BlockManager.add("input-form-slider", {
      label: visualLabel("SL", "Slider Input"),
      category: inputFormsCategory,
      attributes: inputFormBlockAttributes,
      content: '<label style="display:flex;flex-direction:column;gap:8px;font-weight:600;color:#1e293b;">Slider Input<input type="range" name="slider" data-field-key="slider" min="0" max="100" style="width:100%;"/></label>',
    });

    editor.BlockManager.add("input-form-datetime", {
      label: visualLabel("DT", "Date/Time Picker"),
      category: inputFormsCategory,
      attributes: inputFormBlockAttributes,
      content: '<label style="display:flex;flex-direction:column;gap:6px;font-weight:600;color:#1e293b;">Date/Time Picker<input type="datetime-local" name="date_time" data-field-key="date_time" style="padding:10px;border:1px solid #cbd5e1;border-radius:8px;"/></label>',
    });

    editor.BlockManager.add("input-form-image", {
      label: visualLabel("PI", "Picture Uploader"),
      category: inputFormsCategory,
      attributes: inputFormBlockAttributes,
      content: '<label style="display:flex;flex-direction:column;gap:6px;font-weight:600;color:#1e293b;">Picture Uploader<input type="file" name="picture" data-field-key="picture" accept="image/*" style="padding:10px;border:1px solid #cbd5e1;border-radius:8px;background:#fff;"/></label>',
    });

    editor.BlockManager.add("input-form-file", {
      label: visualLabel("FL", "File Uploader"),
      category: inputFormsCategory,
      attributes: inputFormBlockAttributes,
      content: '<label style="display:flex;flex-direction:column;gap:6px;font-weight:600;color:#1e293b;">File Uploader<input type="file" name="file" data-field-key="file" style="padding:10px;border:1px solid #cbd5e1;border-radius:8px;background:#fff;"/></label>',
    });

    editor.BlockManager.add("visual-footer", {
      label: visualLabel("FT", "Footer"),
      content:
        '<footer class="wb-footer"><p>Copyright 2026. All rights reserved.</p></footer>',
    });

    let localSnapshot: Record<string, unknown> | null = null;
    if (localDraftKey) {
      try {
        const raw = window.localStorage.getItem(localDraftKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === "object") {
            localSnapshot = parsed as Record<string, unknown>;
          }
        }
      } catch {
        localSnapshot = null;
      }
    }

    const normalizedProject = normalizeProjectData(initialProjectData) || normalizeProjectData(localSnapshot?.grapesProjectData);

    const localHtml = typeof localSnapshot?.html === "string" && localSnapshot.html.trim()
      ? String(localSnapshot.html)
      : "";

    const serverHtml = typeof initialHtml === "string" && initialHtml.trim()
      ? initialHtml
      : "";

    const fallbackHtml = serverHtml || localHtml || DEFAULT_HTML;

    const localCss = typeof localSnapshot?.css === "string" && localSnapshot.css.trim()
      ? String(localSnapshot.css)
      : "";

    const serverCss = typeof initialCss === "string" && initialCss.trim()
      ? initialCss
      : "";

    const fallbackCss = serverCss || localCss || DEFAULT_CSS;

    const hasPersistedHtml = Boolean(serverHtml || localHtml);

    if (hasPersistedHtml) {
      editor.setComponents(fallbackHtml);
      editor.setStyle(fallbackCss);
    } else if (normalizedProject) {
      try {
        editor.loadProjectData(normalizedProject);
      } catch {
        editor.setComponents(fallbackHtml);
        editor.setStyle(fallbackCss);
      }
    } else {
      editor.setComponents(fallbackHtml);
      editor.setStyle(fallbackCss);
    }

      editor.setDevice("desktop");
      setActiveDevice("desktop");
      syncUndoState();
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
      setActiveDevice("desktop");
      forceCanvasFill();
    });

      editor.on("canvas:frame:load", () => {
      forceCanvasFill();
    });

      editor.on("update", () => {
      if (localBackupRef.current) {
        clearTimeout(localBackupRef.current);
      }
      localBackupRef.current = setTimeout(() => {
        persistLocalSnapshot();
      }, 180);

      if (autosaveRef.current) {
        clearTimeout(autosaveRef.current);
      }

      setStatus("Unsaved changes");
      autosaveRef.current = setTimeout(() => {
        void runSave();
        forceCanvasFill();
      }, 1200);

      syncUndoState();
    });

      editor.on("run:core:undo", () => syncUndoState());
      editor.on("run:core:redo", () => syncUndoState());

      const onKeyDown = (event: KeyboardEvent) => {
        const isMod = event.ctrlKey || event.metaKey;
        if (!isMod) return;

        const key = event.key.toLowerCase();
        if (key === "z" && !event.shiftKey) {
          event.preventDefault();
          editor.UndoManager.undo();
          syncUndoState();
        }

        if ((key === "z" && event.shiftKey) || key === "y") {
          event.preventDefault();
          editor.UndoManager.redo();
          syncUndoState();
        }
      };
      keyHandlerRef.current = onKeyDown;
      window.addEventListener("keydown", onKeyDown);

      editorRef.current = editor;
      renderBlockPanels("");

      const flushLocalOnUnload = () => {
      persistLocalSnapshot();
    };
    window.addEventListener("beforeunload", flushLocalOnUnload);
    window.addEventListener("pagehide", flushLocalOnUnload);

      return () => {
        if (keyHandlerRef.current) {
          window.removeEventListener("keydown", keyHandlerRef.current);
          keyHandlerRef.current = null;
        }
        window.removeEventListener("beforeunload", flushLocalOnUnload);
        window.removeEventListener("pagehide", flushLocalOnUnload);
        editor.destroy();
      };
    };

    let destroyEditor: (() => void) | undefined;
    void setup().then((cleanup) => {
      destroyEditor = cleanup;
    });

    return () => {
      cancelled = true;
      if (localBackupRef.current) {
        clearTimeout(localBackupRef.current);
      }
      if (autosaveRef.current) {
        clearTimeout(autosaveRef.current);
      }
      if (enforceIntervalRef.current) {
        window.clearInterval(enforceIntervalRef.current);
        enforceIntervalRef.current = null;
      }
      destroyEditor?.();
      editorRef.current = null;
    };
  }, [appId, forceCanvasFill, initialCss, initialHtml, initialProjectData, localDraftKey, pageUpdatedAt, persistLocalSnapshot, renderBlockPanels, runSave, syncUndoState]);

  useEffect(() => {
    setSeo({ ...EMPTY_SEO, ...initialSeo });
  }, [initialSeo]);

  useEffect(() => {
    if (!appId) return;

    const load = async () => {
      try {
        const [pagesRes, wfRes, appsRes, projectsRes] = await Promise.all([
          fetch(`/api/nocode/pages?appId=${appId}`, { cache: "no-store" }),
          fetch(`/api/nocode/workflows?appId=${appId}`, { cache: "no-store" }),
          fetch(`/api/nocode/apps`, { cache: "no-store" }),
          fetch(`/api/projects`, { cache: "no-store" }),
        ]);

        if (pagesRes.ok) {
          const pagesJson = await pagesRes.json();
          const list = Array.isArray(pagesJson?.data) ? pagesJson.data : [];
          const mapped = list.map((item: any) => ({
            _id: String(item?._id || ""),
            name: String(item?.name || "Untitled"),
            slug: String(item?.slug || ""),
          }));
          setAppPages(mapped.filter((item: AppPageItem) => item.slug));
        }

        if (wfRes.ok) {
          const wfJson = await wfRes.json();
          const list = Array.isArray(wfJson?.data) ? wfJson.data : [];
          const mapped = list.map((item: any) => ({
            _id: String(item?._id || ""),
            name: String(item?.name || "Untitled"),
            key: String(item?.key || ""),
            status: String(item?.status || "draft"),
            updatedAt: item?.updatedAt ? String(item.updatedAt) : "",
          }));
          setWorkflows(mapped.filter((item: WorkflowItem) => item.key));
        }

        if (projectsRes.ok) {
          const projectList = await projectsRes.json();
          const mappedProjects = (Array.isArray(projectList) ? projectList : []).map((item: any) => ({
            _id: String(item?._id || ""),
            name: String(item?.name || "Untitled"),
            emoji: String(item?.emoji || "📁"),
          })).filter((item: WorkspaceProjectItem) => item._id);

          setWorkspaceProjects(mappedProjects);
        }

        if (appsRes.ok) {
          const appsJson = await appsRes.json();
          const appList = Array.isArray(appsJson?.data) ? appsJson.data : [];
          const currentApp = appList.find((item: any) => String(item?._id || "") === String(appId));

          const linkedProjectId = String(currentApp?.projectId || "");
          if (linkedProjectId) {
            setAppProjectId(linkedProjectId);
          }

          const defaultDbId = String(currentApp?.defaultDatabaseId || "");
          if (defaultDbId) {
            setFormDatabaseId((prev) => prev || defaultDbId);
          }
        }
      } catch {
        // Keep the editor usable even if helper APIs fail.
      }
    };

    void load();
  }, [appId]);

  useEffect(() => {
    if (!appProjectId) {
      setWorkspaceDatabases([]);
      return;
    }

    const loadDatabases = async () => {
      try {
        const res = await fetch(`/api/databases?projectId=${appProjectId}`, { cache: "no-store" });
        if (!res.ok) return;

        const list = await res.json();
        const mapped = (Array.isArray(list) ? list : []).map((item: any) => ({
          _id: String(item?._id || ""),
          name: String(item?.name || "Untitled table"),
          viewType: String(item?.viewType || ""),
        })).filter((item: WorkspaceDatabaseItem) => item._id);

        setWorkspaceDatabases(mapped);
      } catch {
        setWorkspaceDatabases([]);
      }
    };

    void loadDatabases();
  }, [appProjectId]);

  useEffect(() => {
    void fetchDatabasePreviewRows();
  }, [fetchDatabasePreviewRows]);

  useEffect(() => {
    loadSavedSnippets();
  }, [loadSavedSnippets]);

  useEffect(() => {
    renderBlockPanels(elementSearch);
  }, [elementSearch, renderBlockPanels]);

  const undo = () => {
    editorRef.current?.UndoManager.undo();
    syncUndoState();
  };

  const redo = () => {
    editorRef.current?.UndoManager.redo();
    syncUndoState();
  };

  const switchDevice = (device: string) => {
    editorRef.current?.setDevice(device);
    setActiveDevice(device);
    forceCanvasFill();
  };

  const beginFloatingInspectorDrag = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest("button")) return;

    const wrapper = canvasWrapRef.current;
    const panel = floatingInspectorRef.current;
    if (!wrapper || !panel) return;

    event.preventDefault();

    const wrapperRect = wrapper.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();

    const initialX = floatingInspectorPosition?.x ?? (panelRect.left - wrapperRect.left);
    const initialY = floatingInspectorPosition?.y ?? (panelRect.top - wrapperRect.top);

    const offsetX = event.clientX - (wrapperRect.left + initialX);
    const offsetY = event.clientY - (wrapperRect.top + initialY);

    const maxX = Math.max(8, wrapper.clientWidth - panel.offsetWidth - 8);
    const maxY = Math.max(8, wrapper.clientHeight - panel.offsetHeight - 8);

    const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

    const onMouseMove = (moveEvent: MouseEvent) => {
      const nextX = clamp(moveEvent.clientX - wrapperRect.left - offsetX, 8, maxX);
      const nextY = clamp(moveEvent.clientY - wrapperRect.top - offsetY, 8, maxY);
      setFloatingInspectorPosition({ x: nextX, y: nextY });
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }, [floatingInspectorPosition]);

  return (
    <div className="nocode-builder-shell">
      <div className="nocode-builder-toolbar">
        <div className="nocode-toolbar-title-wrap">
          <h2 className="nocode-toolbar-title">{pageName || "Website Builder"}</h2>
          <p className="nocode-toolbar-status">{status}</p>
          <p className="nocode-toolbar-hint">Use drag-and-drop blocks and tweak styles from the right panel.</p>
        </div>

        <div className="nocode-toolbar-actions">
          <button className="nocode-btn nocode-btn-secondary" onClick={undo} disabled={!canUndo} title="Undo last change (Ctrl/Cmd+Z)">Undo</button>
          <button className="nocode-btn nocode-btn-secondary" onClick={redo} disabled={!canRedo} title="Redo last undone change (Ctrl/Cmd+Shift+Z)">Redo</button>
          <span className="nocode-history-pill" title="Tracked edit history">History: {historyDepth}</span>
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
          <button className="nocode-btn nocode-btn-secondary" onClick={saveSelectedAsReusableComponent} title="Save selected section for reuse">
            Save Component
          </button>
          <button className="nocode-btn nocode-btn-secondary" onClick={() => setShowFormBuilder((v) => !v)} title="Build and insert custom forms visually">
            Form Builder
          </button>
          <button
            className="nocode-btn nocode-btn-secondary"
            onClick={openSelectedWorkflowFromBuilder}
            disabled={!workflows.length}
            title="Open workflow editor"
          >
            Workflows
          </button>
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

      {showWorkflowDrawer ? (
        <div
          className="nocode-workflow-drawer-overlay"
          onClick={() => setShowWorkflowDrawer(false)}
          role="presentation"
        >
          <aside
            className="nocode-workflow-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Workflow editor drawer"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="nocode-workflow-drawer-head">
              <div className="nocode-workflow-drawer-title-wrap">
                <h3 className="nocode-workflow-drawer-title">
                  {selectedWorkflow ? selectedWorkflow.name : "Workflow"}
                </h3>
                <p className="nocode-workflow-drawer-subtitle">
                  Manage flow logic without leaving the builder.
                </p>
              </div>

              <div className="nocode-form-builder-actions">
                <button
                  className="nocode-btn nocode-btn-secondary"
                  onClick={() => void renameWorkflowFromDrawer()}
                  type="button"
                  disabled={!workflowDrawerId || isRenamingWorkflow}
                >
                  {isRenamingWorkflow ? "Renaming..." : "Rename"}
                </button>
                <button
                  className="nocode-btn nocode-btn-secondary"
                  onClick={() => setIsRunsPanelCollapsed((value) => !value)}
                  type="button"
                >
                  {isRunsPanelCollapsed ? "Show Runs" : "Hide Runs"}
                </button>
                {workflowDrawerId ? (
                  <a
                    className="nocode-btn nocode-btn-secondary"
                    href={`/nocode/workflows/${workflowDrawerId}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open in Tab
                  </a>
                ) : null}
                <button
                  className="nocode-btn nocode-btn-secondary"
                  onClick={() => setShowWorkflowDrawer(false)}
                  type="button"
                >
                  Open Builder
                </button>
              </div>
            </div>

            <div className="nocode-workflow-drawer-body">
              {workflowDrawerId ? (
                <div className={`nocode-workflow-drawer-split ${isRunsPanelCollapsed ? "runs-collapsed" : ""}`}>
                  <div className="nocode-workflow-drawer-editor">
                    <iframe
                      key={workflowDrawerId}
                      src={`/nocode/workflows/${workflowDrawerId}?embed=1`}
                      className="nocode-workflow-drawer-frame"
                      title="Workflow editor"
                    />
                  </div>

                  <aside className={`nocode-workflow-runs-panel ${isRunsPanelCollapsed ? "collapsed" : ""}`}>
                    {isRunsPanelCollapsed ? (
                      <button
                        className="nocode-workflow-runs-collapse-rail"
                        onClick={() => setIsRunsPanelCollapsed(false)}
                        type="button"
                        aria-label="Show runs panel"
                        title="Show runs panel"
                      >
                        Runs
                      </button>
                    ) : null}

                    {!isRunsPanelCollapsed ? (
                      <>
                        <div className="nocode-workflow-runs-head">
                          <strong>Runs</strong>
                          <button
                            className="nocode-btn nocode-btn-secondary"
                            type="button"
                            onClick={() => void fetchWorkflowRuns()}
                            disabled={runsLoading}
                          >
                            {runsLoading ? "Refreshing..." : "Refresh"}
                          </button>
                        </div>

                        {runsError ? (
                          <p className="nocode-small-helper">{runsError}</p>
                        ) : null}

                        <div className="nocode-workflow-runs-list">
                          {workflowRuns.length ? workflowRuns.map((run) => {
                            const isActive = selectedRun?._id === run._id;
                            const created = run.createdAt ? new Date(run.createdAt) : null;
                            const createdLabel = created && !Number.isNaN(created.getTime())
                              ? created.toLocaleTimeString()
                              : "-";

                            return (
                              <button
                                key={run._id}
                                className={`nocode-workflow-run-item ${isActive ? "active" : ""}`}
                                onClick={() => setSelectedRunId(run._id)}
                                type="button"
                              >
                                <div className="nocode-workflow-item-top">
                                  <span>{run.triggerType || "trigger"}</span>
                                  <span className={`nocode-workflow-badge ${run.status === "success" ? "published" : "draft"}`}>
                                    {run.status || "-"}
                                  </span>
                                </div>
                                <div className="nocode-workflow-item-meta">{run._id}</div>
                                <div className="nocode-workflow-item-meta">Started: {createdLabel}</div>
                              </button>
                            );
                          }) : (
                            <p className="nocode-small-helper">No runs yet for this workflow.</p>
                          )}
                        </div>

                        <div className="nocode-workflow-run-details">
                          <div className="nocode-workflow-list-head">Run Details</div>
                          {selectedRun ? (
                            <>
                              <div className="nocode-workflow-item-meta">Run: {selectedRun._id}</div>
                              <div className="nocode-workflow-item-meta">Status: {selectedRun.status || "-"}</div>
                              {selectedRun.error ? <div className="nocode-workflow-item-meta">Error: {selectedRun.error}</div> : null}
                              <div className="nocode-workflow-list-head">Steps</div>
                              <div className="nocode-workflow-steps-list">
                                {(selectedRun.stepLogs || []).length ? (selectedRun.stepLogs || []).map((step, index) => (
                                  <div className="nocode-workflow-step-item" key={`${selectedRun._id}-step-${index}`}>
                                    <div className="nocode-workflow-item-top">
                                      <span>{step.nodeType || step.nodeId || "step"}</span>
                                      <span className={`nocode-workflow-badge ${step.status === "success" ? "published" : "draft"}`}>
                                        {step.status || "-"}
                                      </span>
                                    </div>
                                    {step.error ? <div className="nocode-workflow-item-meta">{step.error}</div> : null}
                                  </div>
                                )) : (
                                  <p className="nocode-small-helper">No step logs yet.</p>
                                )}
                              </div>
                            </>
                          ) : (
                            <p className="nocode-small-helper">Select a run to inspect details.</p>
                          )}
                        </div>
                      </>
                    ) : null}
                  </aside>
                </div>
              ) : (
                <p className="nocode-small-helper">Select or create a workflow first.</p>
              )}
            </div>
          </aside>
        </div>
      ) : null}

      <div className={`nocode-builder-grid ${isRightSidebarCollapsed ? "right-collapsed" : ""}`}>
        <aside className="nocode-panel nocode-panel-left">
          <div className="nocode-left-tabs" role="tablist" aria-label="Builder panel mode">
            <button
              className={`nocode-left-tab ${leftPanelMode === "builder" ? "active" : ""}`}
              onClick={() => setLeftPanelMode("builder")}
              role="tab"
              aria-selected={leftPanelMode === "builder"}
            >
              Builder
            </button>
            <button
              className={`nocode-left-tab ${leftPanelMode === "responsive" ? "active" : ""}`}
              onClick={() => setLeftPanelMode("responsive")}
              role="tab"
              aria-selected={leftPanelMode === "responsive"}
            >
              Responsive
            </button>
          </div>

          {leftPanelMode === "responsive" ? (
            <section className="nocode-left-group">
              <div className="nocode-left-group-head">
                <strong>Preview Devices</strong>
              </div>
              <div className="nocode-device-row nocode-device-row-left">
                {DEVICE_OPTIONS.map((device) => (
                  <button
                    key={device.id}
                    className={`nocode-chip ${activeDevice === device.id ? "active" : ""}`}
                    onClick={() => switchDevice(device.id)}
                  >
                    {device.label}
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {leftPanelMode !== "responsive" ? (
            <>
              <div className="nocode-left-search-row">
                <input
                  value={elementSearch}
                  onChange={(e) => setElementSearch(e.target.value)}
                  placeholder="Search elements"
                  aria-label="Search elements"
                />
              </div>

              <section className="nocode-left-group">
                <div className="nocode-left-group-head">
                  <strong>Elements Tree</strong>
                  <div className="nocode-left-group-tools" aria-hidden>
                    <span>O</span>
                    <span>[]</span>
                  </div>
                </div>

                <div className="nocode-left-tree-item">index</div>

                <details className="nocode-left-accordion" open>
                  <summary>Layers</summary>
                  <div id="gjs-layers" className="nocode-pane-scroll nocode-left-pane-scroll" />
                </details>
              </section>

              <div className="nocode-left-search-row">
                <input
                  value={assetSearch}
                  onChange={(e) => setAssetSearch(e.target.value)}
                  placeholder="Search assets"
                  aria-label="Search assets"
                />
              </div>
            </>
          ) : null}

          <details className="nocode-left-accordion" open>
            <summary>Visual Elements</summary>
            <div id="gjs-blocks" className="nocode-pane-scroll nocode-left-pane-scroll" />
          </details>

          <details className="nocode-left-accordion" open>
            <summary>Containers</summary>
            <div id="gjs-container-blocks" className="nocode-pane-scroll nocode-left-pane-scroll" />
          </details>

          <details className="nocode-left-accordion" open>
            <summary>Input forms</summary>
            <div id="gjs-input-form-blocks" className="nocode-pane-scroll nocode-left-pane-scroll" />
            <div className="nocode-left-inline-action">
              <button className="nocode-btn nocode-btn-secondary" onClick={() => setShowFormBuilder((v) => !v)}>
                {showFormBuilder ? "Hide Form Builder" : "Open Form Builder"}
              </button>
            </div>
          </details>

          <details className="nocode-left-accordion" open>
            <summary>Reusable elements</summary>
            <div className="nocode-pane-scroll nocode-left-pane-scroll nocode-reusable-list">
              {filteredSnippets.length ? filteredSnippets.map((snippet) => (
                <div className="nocode-reusable-item" key={snippet.id}>
                  <span>{snippet.name}</span>
                  <button className="nocode-btn nocode-btn-secondary" onClick={() => insertReusableComponent(snippet)}>Insert</button>
                </div>
              )) : <p className="nocode-small-helper">No reusable elements found.</p>}
            </div>
          </details>
        </aside>

        <div className="nocode-canvas-wrap" ref={canvasWrapRef}>
          <div ref={rootRef} className="nocode-canvas-host" />

          <div
            ref={floatingInspectorRef}
            className={`nocode-floating-inspector ${showFloatingInspector ? "open" : ""}`}
            style={floatingInspectorPosition ? { left: `${floatingInspectorPosition.x}px`, top: `${floatingInspectorPosition.y}px`, right: "auto" } : undefined}
          >
            <div className="nocode-floating-inspector-head" onMouseDown={beginFloatingInspectorDrag}>
              <div className="nocode-floating-inspector-tabs">
                <button
                  className={`nocode-floating-tab ${floatingInspectorTab === "properties" ? "active" : ""}`}
                  onClick={() => setFloatingInspectorTab("properties")}
                >
                  Properties
                </button>
                <button
                  className={`nocode-floating-tab ${floatingInspectorTab === "styles" ? "active" : ""}`}
                  onClick={() => setFloatingInspectorTab("styles")}
                >
                  Styles
                </button>
              </div>
              <button className="nocode-floating-close" onClick={() => setShowFloatingInspector(false)} aria-label="Close inspector">
                x
              </button>
            </div>

            <div className={`nocode-floating-pane ${floatingInspectorTab === "properties" ? "active" : ""}`}>
              <div id="gjs-traits" className="nocode-pane-scroll" />
            </div>
            <div className={`nocode-floating-pane ${floatingInspectorTab === "styles" ? "active" : ""}`}>
              <div id="gjs-styles" className="nocode-pane-scroll" />
            </div>
          </div>

          {showFormBuilder ? (
            <div className="nocode-form-builder">
              <div className="nocode-form-builder-head">
                <h4>Visual Form Builder</h4>
                <button
                  className="nocode-form-builder-close"
                  onClick={() => setShowFormBuilder(false)}
                  aria-label="Close form builder"
                  title="Close"
                >
                  x
                </button>
              </div>
              <p>Create fields, connect workflow, and write submissions into a project table.</p>

              <label>Project</label>
              <select
                value={appProjectId}
                onChange={(e) => {
                  const nextProjectId = e.target.value;
                  setAppProjectId(nextProjectId);
                  const applied = applyDatabaseBindingToSelectedBinding(formDatabaseId, nextProjectId);
                  if (!applied) {
                    setStatus("Project selected. Select a form or workflow scope to bind it.");
                  }
                }}
              >
                <option value="">Select project</option>
                {workspaceProjects.map((project) => (
                  <option key={project._id} value={project._id}>
                    {(project.emoji || "📁") + " " + project.name}
                  </option>
                ))}
              </select>

              <label>Database Table</label>
              <select
                value={formDatabaseId}
                onChange={(e) => {
                  const nextDatabaseId = e.target.value;
                  setFormDatabaseId(nextDatabaseId);
                  const applied = applyDatabaseBindingToSelectedBinding(nextDatabaseId, appProjectId);
                  if (!applied) {
                    setStatus("Select a form, workflow scope, or submit trigger");
                  }
                }}
                disabled={!appProjectId}
              >
                <option value="">No table</option>
                {workspaceDatabases.map((db) => (
                  <option value={db._id} key={db._id}>
                    {db.name} {db.viewType ? `(${db.viewType})` : ""}
                  </option>
                ))}
              </select>

              <div className="nocode-form-builder-actions">
                <input
                  value={newDatabaseName}
                  onChange={(e) => setNewDatabaseName(e.target.value)}
                  placeholder="New table name"
                />
                <button
                  className="nocode-btn nocode-btn-secondary"
                  onClick={() => void createFormDatabaseFromBuilder()}
                  disabled={!appProjectId || isCreatingFormDatabase}
                >
                  {isCreatingFormDatabase ? "Creating..." : "Create Table"}
                </button>
              </div>

              <section className="nocode-data-section">
                <div className="nocode-data-section-head">
                  <div>
                    <strong>Data</strong>
                    <p>Live rows from the selected table</p>
                  </div>
                  <button
                    className="nocode-btn nocode-btn-secondary"
                    onClick={() => void fetchDatabasePreviewRows()}
                    disabled={!formDatabaseId || isDatabasePreviewLoading}
                    type="button"
                  >
                    {isDatabasePreviewLoading ? "Refreshing..." : "Refresh"}
                  </button>
                </div>

                {!formDatabaseId ? (
                  <p className="nocode-small-helper">Select a table to view data.</p>
                ) : databasePreviewRows.length ? (
                  <div className="nocode-data-grid-wrap">
                    <table className="nocode-data-grid">
                      <thead>
                        <tr>
                          <th>#</th>
                          {databasePreviewColumns.map((column) => (
                            <th key={column}>{column}</th>
                          ))}
                          <th>Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {databasePreviewRows.map((row, index) => {
                          const values = row.values || {};
                          return (
                            <tr key={row._id}>
                              <td>{index + 1}</td>
                              {databasePreviewColumns.map((column) => (
                                <td key={`${row._id}-${column}`}>{formatDataPreviewCell(values[column])}</td>
                              ))}
                              <td>{row.createdAt ? new Date(row.createdAt).toLocaleString() : "-"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="nocode-small-helper">No rows yet in this table.</p>
                )}
              </section>

              <label>Workflow</label>
              <select
                value={formWorkflowKey}
                onChange={(e) => {
                  const nextKey = e.target.value;
                  setFormWorkflowKey(nextKey);
                  const applied = applyWorkflowKeyToSelectedBinding(nextKey);
                  if (!applied) {
                    setStatus("Select a form, workflow scope, or submit trigger");
                  }
                }}
              >
                <option value="">No workflow</option>
                {workflows.map((wf) => (
                  <option value={wf.key} key={wf._id}>{wf.name} ({wf.key})</option>
                ))}
              </select>

              <div className="nocode-form-builder-actions">
                <button className="nocode-btn nocode-btn-secondary" onClick={() => void createWorkflowFromBuilder()}>Create Workflow</button>
                <button className="nocode-btn nocode-btn-secondary" onClick={openSelectedWorkflowFromBuilder} disabled={!workflows.length}>Open Workflow</button>
              </div>

              <div className="nocode-workflow-list">
                <div className="nocode-workflow-list-head">Available Workflows</div>
                {workflows.length ? workflows.map((wf) => {
                  const selected = formWorkflowKey === wf.key;
                  const updated = wf.updatedAt ? new Date(wf.updatedAt) : null;
                  const updatedLabel = updated && !Number.isNaN(updated.getTime())
                    ? updated.toLocaleString()
                    : "-";

                  return (
                    <button
                      key={wf._id}
                      className={`nocode-workflow-item ${selected ? "active" : ""}`}
                      onClick={() => {
                        setFormWorkflowKey(wf.key);
                        const applied = applyWorkflowKeyToSelectedBinding(wf.key);
                        if (!applied) {
                          setStatus("Select a form, workflow scope, or submit trigger");
                        }
                      }}
                      type="button"
                    >
                      <div className="nocode-workflow-item-top">
                        <strong>{wf.name}</strong>
                        <span className={`nocode-workflow-badge ${wf.status === "published" ? "published" : "draft"}`}>
                          {wf.status}
                        </span>
                      </div>
                      <div className="nocode-workflow-item-meta">{wf.key}</div>
                      <div className="nocode-workflow-item-meta">Updated: {updatedLabel}</div>
                    </button>
                  );
                }) : (
                  <p className="nocode-small-helper">No workflows found for this app.</p>
                )}
              </div>

              <label>Submit Button Label</label>
              <input value={formSubmitLabel} onChange={(e) => setFormSubmitLabel(e.target.value)} placeholder="Submit" />

              <div className="nocode-form-fields">
                {formFields.map((field, index) => (
                  <div className="nocode-form-field" key={field.id}>
                    <strong>Field {index + 1}</strong>
                    <input value={field.label} onChange={(e) => setFormFields((prev) => prev.map((item) => item.id === field.id ? { ...item, label: e.target.value } : item))} placeholder="Label" />
                    <input value={field.name} onChange={(e) => setFormFields((prev) => prev.map((item) => item.id === field.id ? { ...item, name: e.target.value } : item))} placeholder="Name" />
                    <select value={field.type} onChange={(e) => setFormFields((prev) => prev.map((item) => item.id === field.id ? { ...item, type: e.target.value as FormField["type"] } : item))}>
                      <option value="text">Input</option>
                      <option value="textarea">Multiline Input</option>
                      <option value="checkbox">Checkbox</option>
                      <option value="select">Dropdown</option>
                      <option value="search">Searchbox</option>
                      <option value="radio">Radio Buttons</option>
                      <option value="range">Slider Input</option>
                      <option value="datetime-local">Date/Time Picker</option>
                      <option value="image">Picture Uploader</option>
                      <option value="file">File Uploader</option>
                      <option value="email">Email</option>
                      <option value="password">Password</option>
                      <option value="number">Number</option>
                      <option value="tel">Phone</option>
                      <option value="url">URL</option>
                      <option value="date">Date</option>
                    </select>
                    {FORM_FIELD_TYPES_WITH_PLACEHOLDER.has(field.type) ? (
                      <input value={field.placeholder} onChange={(e) => setFormFields((prev) => prev.map((item) => item.id === field.id ? { ...item, placeholder: e.target.value } : item))} placeholder="Placeholder" />
                    ) : null}
                    {FORM_FIELD_TYPES_WITH_OPTIONS.has(field.type) ? (
                      <input
                        value={field.options}
                        onChange={(e) => setFormFields((prev) => prev.map((item) => item.id === field.id ? { ...item, options: e.target.value } : item))}
                        placeholder="Options (comma separated)"
                      />
                    ) : null}
                    {FORM_FIELD_TYPES_WITH_MIN_MAX.has(field.type) ? (
                      <div className="nocode-inline-grid">
                        <input value={field.min} onChange={(e) => setFormFields((prev) => prev.map((item) => item.id === field.id ? { ...item, min: e.target.value } : item))} placeholder="Min" />
                        <input value={field.max} onChange={(e) => setFormFields((prev) => prev.map((item) => item.id === field.id ? { ...item, max: e.target.value } : item))} placeholder="Max" />
                      </div>
                    ) : null}
                    <label className="nocode-checkbox-row">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => setFormFields((prev) => prev.map((item) => item.id === field.id ? { ...item, required: e.target.checked } : item))}
                      />
                      Required
                    </label>
                    {field.type === "checkbox" || field.type === "radio" ? (
                      <label className="nocode-checkbox-row">
                        <input
                          type="checkbox"
                          checked={field.checked}
                          onChange={(e) => setFormFields((prev) => prev.map((item) => item.id === field.id ? { ...item, checked: e.target.checked } : item))}
                        />
                        {field.type === "radio" ? "Select first option by default" : "Checked by default"}
                      </label>
                    ) : null}
                  </div>
                ))}
              </div>

              <div className="nocode-form-builder-actions">
                <button className="nocode-btn nocode-btn-secondary" onClick={addFormField}>Add Field</button>
                <button className="nocode-btn nocode-btn-primary" onClick={insertBuiltForm}>Insert Form</button>
              </div>
            </div>
          ) : null}
        </div>

        <aside className={`nocode-panel nocode-panel-right ${isRightSidebarCollapsed ? "collapsed" : ""}`}>
          <button
            className="nocode-right-collapse-btn"
            onClick={() => setIsRightSidebarCollapsed((v) => !v)}
            aria-label={isRightSidebarCollapsed ? "Expand side panel" : "Collapse side panel"}
            title={isRightSidebarCollapsed ? "Expand" : "Collapse"}
          >
            {isRightSidebarCollapsed ? "<" : ">"}
          </button>

          <div className="nocode-right-content">
            <h3>Page Linking</h3>
            <div className="nocode-pane-scroll">
              <select className="nocode-full-width" value={selectedPageSlug} onChange={(e) => setSelectedPageSlug(e.target.value)}>
                <option value="">Select page</option>
                {appPages.map((page) => (
                  <option key={page._id} value={page.slug}>{page.name} ({page.slug})</option>
                ))}
              </select>
              <button
                className="nocode-btn nocode-btn-secondary nocode-full-width"
                onClick={() => linkSelectedElement(selectedPageSlug)}
                disabled={!selectedPageSlug}
              >
                Link Selected Element
              </button>
            </div>

            <h3>Workflows</h3>
            <div className="nocode-pane-scroll nocode-seo-panel">
              <label>Active Workflow</label>
              <select
                className="nocode-full-width"
                value={formWorkflowKey}
                onChange={(e) => {
                  const nextKey = e.target.value;
                  setFormWorkflowKey(nextKey);
                  const applied = applyWorkflowKeyToSelectedBinding(nextKey);
                  if (!applied) {
                    setStatus("Select a form, workflow scope, or submit trigger");
                  }
                }}
              >
                <option value="">No workflow</option>
                {workflows.map((wf) => (
                  <option value={wf.key} key={wf._id}>{wf.name} ({wf.key})</option>
                ))}
              </select>

              <div className="nocode-form-builder-actions">
                <button
                  className="nocode-btn nocode-btn-secondary nocode-full-width"
                  onClick={() => {
                    const applied = applyWorkflowKeyToSelectedBinding(formWorkflowKey);
                    if (!applied) {
                      setStatus("Select a form, workflow scope, or submit trigger");
                    }
                  }}
                >
                  Apply To Selected
                </button>
                <button className="nocode-btn nocode-btn-secondary nocode-full-width" onClick={() => void createWorkflowFromBuilder()}>
                  Create Workflow
                </button>
                <button className="nocode-btn nocode-btn-secondary nocode-full-width" onClick={openSelectedWorkflowFromBuilder} disabled={!workflows.length}>
                  Open Workflow
                </button>
              </div>

              <p className="nocode-small-helper">
                {selectedWorkflow
                  ? `Selected: ${selectedWorkflow.name} (${selectedWorkflow.status})`
                  : "No workflow yet. Create one to connect forms and automations."}
              </p>
            </div>

            <h3>SEO</h3>
            <div className="nocode-pane-scroll nocode-seo-panel">
              <label>Page Title</label>
              <input value={seo.title} onChange={(e) => setSeo((prev) => ({ ...prev, title: e.target.value }))} />
              <label>Meta Description</label>
              <textarea value={seo.description} onChange={(e) => setSeo((prev) => ({ ...prev, description: e.target.value }))} rows={2} />
              <label>OG Title</label>
              <input value={seo.ogTitle} onChange={(e) => setSeo((prev) => ({ ...prev, ogTitle: e.target.value }))} />
              <label>OG Description</label>
              <textarea value={seo.ogDescription} onChange={(e) => setSeo((prev) => ({ ...prev, ogDescription: e.target.value }))} rows={2} />
              <label>OG Image URL</label>
              <input value={seo.ogImage} onChange={(e) => setSeo((prev) => ({ ...prev, ogImage: e.target.value }))} placeholder="https://..." />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}