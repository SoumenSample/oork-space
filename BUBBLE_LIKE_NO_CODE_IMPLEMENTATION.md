# Bubble-like No-code Builder Implementation

This guide shows how to build a Bubble-like platform in your current Next.js project using:
1. GrapesJS for visual page building
2. React Flow for workflow building
3. MongoDB for metadata
4. Server-side runtime for workflow execution

You will implement a production-minded MVP in strict order.

## 1. Scope and MVP Definition

Build these features first:
1. Multi-tenant app container (workspace -> app)
2. Visual page editor (GrapesJS)
3. Save draft and publish pages
4. Public page rendering by slug
5. Visual workflow builder (React Flow)
6. Workflow runtime with trigger -> conditions -> actions
7. Form submit trigger from built pages
8. Run logs and error traces

Do not build advanced plugin marketplace or custom code execution in MVP.

## 2. Install Required Packages

Run:

```bash
npm i grapesjs reactflow sanitize-html zod
```

Optional for robust background jobs later:

```bash
npm i bullmq ioredis
```

## 3. Environment Variables

Add these to .env.local:

```env
MONGO_URI=mongodb://127.0.0.1:27017/multi-tasking
APP_URL=http://localhost:3000
INTERNAL_WORKFLOW_TOKEN=change-me-long-random-string
```

If you enable queue workers later, also add:

```env
REDIS_URL=redis://127.0.0.1:6379
```

## 4. Folder Structure to Create

Create these folders:

```text
app/
  api/
    nocode/
      apps/
        route.ts
      apps/[appId]/
        route.ts
      pages/
        route.ts
      pages/[id]/
        route.ts
      pages/[id]/publish/
        route.ts
      pages/slug/[slug]/
        route.ts
      workflows/
        route.ts
      workflows/[id]/
        route.ts
      workflows/[id]/publish/
        route.ts
      trigger/form-submit/
        route.ts
      runs/
        route.ts
      runs/[id]/
        route.ts
  nocode/
    apps/
      page.tsx
    builder/
      [pageId]/
        page.tsx
    workflows/
      [workflowId]/
        page.tsx
  p/
    [slug]/
      page.tsx

components/
  nocode/
    grapes/
      GrapesEditor.tsx
      blockDefinitions.ts
    workflow/
      WorkflowEditor.tsx
      nodeRegistry.ts

lib/
  models/
    NocodeApp.ts
    NocodePage.ts
    NocodeWorkflow.ts
    NocodeRun.ts
  nocode/
    slug.ts
    versioning.ts
    workflowCompiler.ts
    workflowRuntime.ts
    runtimeActions.ts
    runtimeConditions.ts
    renderer.ts
```

## 5. Define Core Data Models

### 5.1 NocodeApp model

Create lib/models/NocodeApp.ts:

```ts
import mongoose from "mongoose";

const NocodeAppSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    key: { type: String, required: true, unique: true, index: true },
    status: { type: String, enum: ["active", "archived"], default: "active" },
  },
  { timestamps: true }
);

if (process.env.NODE_ENV !== "production") {
  delete mongoose.models.NocodeApp;
}

export default mongoose.models.NocodeApp ||
  mongoose.model("NocodeApp", NocodeAppSchema);
```

### 5.2 NocodePage model

Create lib/models/NocodePage.ts:

```ts
import mongoose from "mongoose";

const NocodePageSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    appId: { type: mongoose.Schema.Types.ObjectId, ref: "NocodeApp", required: true, index: true },

    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },

    draft: {
      grapesProjectData: { type: mongoose.Schema.Types.Mixed, default: null },
      html: { type: String, default: "" },
      css: { type: String, default: "" },
      js: { type: String, default: "" },
      bindings: { type: mongoose.Schema.Types.Mixed, default: [] },
    },

    published: {
      grapesProjectData: { type: mongoose.Schema.Types.Mixed, default: null },
      html: { type: String, default: "" },
      css: { type: String, default: "" },
      js: { type: String, default: "" },
      bindings: { type: mongoose.Schema.Types.Mixed, default: [] },
      version: { type: Number, default: 0 },
      publishedAt: { type: Date, default: null },
    },

    status: { type: String, enum: ["draft", "published"], default: "draft" },
  },
  { timestamps: true }
);

if (process.env.NODE_ENV !== "production") {
  delete mongoose.models.NocodePage;
}

export default mongoose.models.NocodePage ||
  mongoose.model("NocodePage", NocodePageSchema);
```

### 5.3 NocodeWorkflow model

Create lib/models/NocodeWorkflow.ts:

```ts
import mongoose from "mongoose";

const NocodeWorkflowSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    appId: { type: mongoose.Schema.Types.ObjectId, ref: "NocodeApp", required: true, index: true },

    name: { type: String, required: true },
    key: { type: String, required: true, index: true },

    draftGraph: {
      nodes: { type: Array, default: [] },
      edges: { type: Array, default: [] },
    },

    publishedGraph: {
      nodes: { type: Array, default: [] },
      edges: { type: Array, default: [] },
      version: { type: Number, default: 0 },
      publishedAt: { type: Date, default: null },
    },

    status: { type: String, enum: ["draft", "published"], default: "draft" },
  },
  { timestamps: true }
);

if (process.env.NODE_ENV !== "production") {
  delete mongoose.models.NocodeWorkflow;
}

export default mongoose.models.NocodeWorkflow ||
  mongoose.model("NocodeWorkflow", NocodeWorkflowSchema);
```

### 5.4 NocodeRun model

Create lib/models/NocodeRun.ts:

```ts
import mongoose from "mongoose";

const NocodeRunSchema = new mongoose.Schema(
  {
    userId: { type: String, required: false, index: true },
    appId: { type: mongoose.Schema.Types.ObjectId, ref: "NocodeApp", required: true, index: true },
    workflowId: { type: mongoose.Schema.Types.ObjectId, ref: "NocodeWorkflow", required: true, index: true },

    triggerType: { type: String, required: true },
    triggerPayload: { type: mongoose.Schema.Types.Mixed, default: {} },

    status: { type: String, enum: ["queued", "running", "success", "failed"], default: "queued", index: true },

    stepLogs: {
      type: [
        {
          nodeId: String,
          nodeType: String,
          status: String,
          input: mongoose.Schema.Types.Mixed,
          output: mongoose.Schema.Types.Mixed,
          error: String,
          startedAt: Date,
          endedAt: Date,
        },
      ],
      default: [],
    },

    error: { type: String, default: "" },
    startedAt: { type: Date, default: null },
    finishedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

if (process.env.NODE_ENV !== "production") {
  delete mongoose.models.NocodeRun;
}

export default mongoose.models.NocodeRun ||
  mongoose.model("NocodeRun", NocodeRunSchema);
```

## 6. Shared Utility Files

### 6.1 Slug helpers

Create lib/nocode/slug.ts:

```ts
export function normalizeSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function uniqueSlug(name: string): string {
  const base = normalizeSlug(name || "untitled");
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base || "page"}-${suffix}`;
}
```

### 6.2 Version helper

Create lib/nocode/versioning.ts:

```ts
export function nextVersion(current: number | undefined | null): number {
  const safe = typeof current === "number" && Number.isFinite(current) ? current : 0;
  return safe + 1;
}
```

## 7. Create App APIs

### 7.1 Create/list apps

Create app/api/nocode/apps/route.ts:

```ts
import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConnect";
import { getAuthUser } from "@/lib/authUser";
import NocodeApp from "@/lib/models/NocodeApp";
import { uniqueSlug } from "@/lib/nocode/slug";

export async function POST(req: Request) {
  try {
    await connectDB();

    const auth = await getAuthUser();
    if (!auth?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const name = String(body?.name || "Untitled App");

    const app = await NocodeApp.create({
      userId: auth.userId,
      name,
      key: uniqueSlug(name),
    });

    return NextResponse.json({ success: true, data: app }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to create app" }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connectDB();

    const auth = await getAuthUser();
    if (!auth?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apps = await NocodeApp.find({ userId: auth.userId }).sort({ updatedAt: -1 });
    return NextResponse.json({ success: true, data: apps });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to list apps" }, { status: 500 });
  }
}
```

## 8. Create Page APIs

### 8.1 Create/list pages

Create app/api/nocode/pages/route.ts:

```ts
import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConnect";
import { getAuthUser } from "@/lib/authUser";
import NocodePage from "@/lib/models/NocodePage";
import NocodeApp from "@/lib/models/NocodeApp";
import { uniqueSlug } from "@/lib/nocode/slug";

export async function POST(req: Request) {
  try {
    await connectDB();
    const auth = await getAuthUser();
    if (!auth?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const appId = String(body?.appId || "");
    const name = String(body?.name || "Untitled Page");

    const app = await NocodeApp.findOne({ _id: appId, userId: auth.userId });
    if (!app) {
      return NextResponse.json({ error: "App not found" }, { status: 404 });
    }

    const page = await NocodePage.create({
      userId: auth.userId,
      appId,
      name,
      slug: uniqueSlug(name),
      draft: {
        grapesProjectData: null,
        html: "",
        css: "",
        js: "",
        bindings: [],
      },
      published: {
        grapesProjectData: null,
        html: "",
        css: "",
        js: "",
        bindings: [],
        version: 0,
        publishedAt: null,
      },
      status: "draft",
    });

    return NextResponse.json({ success: true, data: page }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to create page" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    await connectDB();
    const auth = await getAuthUser();
    if (!auth?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const appId = url.searchParams.get("appId");

    const query: Record<string, unknown> = { userId: auth.userId };
    if (appId) query.appId = appId;

    const pages = await NocodePage.find(query).sort({ updatedAt: -1 });
    return NextResponse.json({ success: true, data: pages });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to list pages" }, { status: 500 });
  }
}
```

### 8.2 Get/update page by id

Create app/api/nocode/pages/[id]/route.ts:

```ts
import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConnect";
import { getAuthUser } from "@/lib/authUser";
import NocodePage from "@/lib/models/NocodePage";

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const auth = await getAuthUser();
    if (!auth?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const page = await NocodePage.findOne({ _id: id, userId: auth.userId });
    if (!page) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: page });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch page" }, { status: 500 });
  }
}

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const auth = await getAuthUser();
    if (!auth?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json();

    const page = await NocodePage.findOneAndUpdate(
      { _id: id, userId: auth.userId },
      {
        $set: {
          name: typeof body?.name === "string" ? body.name : undefined,
          "draft.grapesProjectData": body?.draft?.grapesProjectData,
          "draft.html": typeof body?.draft?.html === "string" ? body.draft.html : "",
          "draft.css": typeof body?.draft?.css === "string" ? body.draft.css : "",
          "draft.js": typeof body?.draft?.js === "string" ? body.draft.js : "",
          "draft.bindings": Array.isArray(body?.draft?.bindings) ? body.draft.bindings : [],
          updatedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!page) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: page });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to save page" }, { status: 500 });
  }
}
```

### 8.3 Publish page

Create app/api/nocode/pages/[id]/publish/route.ts:

```ts
import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConnect";
import { getAuthUser } from "@/lib/authUser";
import NocodePage from "@/lib/models/NocodePage";
import { nextVersion } from "@/lib/nocode/versioning";

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const auth = await getAuthUser();
    if (!auth?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const page = await NocodePage.findOne({ _id: id, userId: auth.userId });
    if (!page) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const version = nextVersion(page.published?.version);

    page.published = {
      grapesProjectData: page.draft?.grapesProjectData ?? null,
      html: page.draft?.html ?? "",
      css: page.draft?.css ?? "",
      js: page.draft?.js ?? "",
      bindings: page.draft?.bindings ?? [],
      version,
      publishedAt: new Date(),
    };

    page.status = "published";
    page.updatedAt = new Date();

    await page.save();

    return NextResponse.json({ success: true, data: page });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to publish page" }, { status: 500 });
  }
}
```

## 9. Public Rendering Route

### 9.1 Safe renderer helper

Create lib/nocode/renderer.ts:

```ts
import sanitizeHtml from "sanitize-html";

export function safeHtml(html: string): string {
  return sanitizeHtml(html || "", {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "section", "article", "style"]),
    allowedAttributes: {
      "*": ["class", "id", "style", "data-*"],
      a: ["href", "target", "rel"],
      img: ["src", "alt", "width", "height"],
      form: ["method", "action", "data-workflow-key"],
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
```

### 9.2 Public route

Create app/p/[slug]/page.tsx:

```tsx
import { notFound } from "next/navigation";
import connectDB from "@/lib/dbConnect";
import NocodePage from "@/lib/models/NocodePage";
import { safeCss, safeHtml } from "@/lib/nocode/renderer";

export default async function PublicPage({ params }: { params: Promise<{ slug: string }> }) {
  await connectDB();
  const { slug } = await params;

  const page = await NocodePage.findOne({ slug, status: "published" });
  if (!page) {
    notFound();
  }

  const html = safeHtml(page.published?.html || "");
  const css = safeCss(page.published?.css || "");

  return (
    <main>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </main>
  );
}
```

## 10. GrapesJS Visual Builder

### 10.1 GrapesJS component

Create components/nocode/grapes/GrapesEditor.tsx:

```tsx
"use client";

import { useEffect, useRef } from "react";
import grapesjs from "grapesjs";
import "grapesjs/dist/css/grapes.min.css";

type Props = {
  initialProjectData?: unknown;
  onSave: (payload: {
    grapesProjectData: unknown;
    html: string;
    css: string;
    js: string;
    bindings: Array<Record<string, unknown>>;
  }) => Promise<void>;
  onPublish: () => Promise<void>;
};

export default function GrapesEditor({ initialProjectData, onSave, onPublish }: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<ReturnType<typeof grapesjs.init> | null>(null);

  useEffect(() => {
    if (!rootRef.current || editorRef.current) return;

    const editor = grapesjs.init({
      container: rootRef.current,
      fromElement: false,
      height: "85vh",
      storageManager: false,
      panels: { defaults: [] },
      blockManager: {
        appendTo: "#gjs-blocks",
      },
      styleManager: {
        appendTo: "#gjs-styles",
      },
      layerManager: {
        appendTo: "#gjs-layers",
      },
      selectorManager: {
        appendTo: "#gjs-selectors",
      },
      traitManager: {
        appendTo: "#gjs-traits",
      },
    });

    editor.BlockManager.add("section", {
      label: "Section",
      content: "<section class=\"section\"><h2>Section title</h2><p>Section content</p></section>",
    });

    editor.BlockManager.add("hero", {
      label: "Hero",
      content:
        "<section class=\"hero\"><h1>Hero title</h1><p>Hero subtitle</p><button>Get Started</button></section>",
    });

    editor.BlockManager.add("form", {
      label: "Form",
      content:
        "<form data-workflow-key=\"\"><input name=\"email\" type=\"email\" placeholder=\"Email\" required/><button type=\"submit\">Submit</button></form>",
    });

    if (initialProjectData) {
      try {
        editor.loadProjectData(initialProjectData as Record<string, unknown>);
      } catch {
        // no-op for invalid project shape
      }
    }

    editor.Commands.add("save-project", {
      run: async () => {
        const project = editor.getProjectData();
        await onSave({
          grapesProjectData: project,
          html: editor.getHtml(),
          css: editor.getCss(),
          js: editor.getJs(),
          bindings: [],
        });
      },
    });

    editor.Commands.add("publish-project", {
      run: async () => {
        await editor.runCommand("save-project");
        await onPublish();
      },
    });

    editor.Panels.addPanel({
      id: "top-actions",
      el: ".gjs-pn-commands",
      buttons: [
        {
          id: "save",
          label: "Save",
          command: "save-project",
        },
        {
          id: "publish",
          label: "Publish",
          command: "publish-project",
        },
      ],
    });

    editorRef.current = editor;

    return () => {
      editor.destroy();
      editorRef.current = null;
    };
  }, [initialProjectData, onPublish, onSave]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "260px 1fr 280px", gap: 12 }}>
      <aside>
        <h3>Blocks</h3>
        <div id="gjs-blocks" />
      </aside>

      <div ref={rootRef} />

      <aside>
        <h3>Styles</h3>
        <div id="gjs-styles" />
        <h3>Traits</h3>
        <div id="gjs-traits" />
      </aside>
    </div>
  );
}
```

### 10.2 Builder route page

Create app/nocode/builder/[pageId]/page.tsx:

```tsx
"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

const GrapesEditor = dynamic(() => import("@/components/nocode/grapes/GrapesEditor"), {
  ssr: false,
});

export default function NocodeBuilderPage() {
  const params = useParams();
  const pageId = useMemo(() => {
    const id = params?.pageId;
    return Array.isArray(id) ? id[0] : (id as string);
  }, [params]);

  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState<any>(null);

  useEffect(() => {
    if (!pageId) return;

    const load = async () => {
      try {
        const res = await fetch(`/api/nocode/pages/${pageId}`);
        const json = await res.json();
        setPage(json?.data || null);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [pageId]);

  if (loading) return <div>Loading builder...</div>;
  if (!page) return <div>Page not found</div>;

  return (
    <div style={{ padding: 12 }}>
      <h1 style={{ marginBottom: 10 }}>Builder: {page.name}</h1>
      <GrapesEditor
        initialProjectData={page?.draft?.grapesProjectData}
        onSave={async (draft) => {
          await fetch(`/api/nocode/pages/${pageId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ draft }),
          });
        }}
        onPublish={async () => {
          await fetch(`/api/nocode/pages/${pageId}/publish`, { method: "POST" });
          alert("Published");
        }}
      />
    </div>
  );
}
```

## 11. Workflow Builder (React Flow)

### 11.1 Workflow APIs

Create app/api/nocode/workflows/route.ts:

```ts
import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConnect";
import { getAuthUser } from "@/lib/authUser";
import NocodeWorkflow from "@/lib/models/NocodeWorkflow";
import NocodeApp from "@/lib/models/NocodeApp";
import { uniqueSlug } from "@/lib/nocode/slug";

export async function POST(req: Request) {
  try {
    await connectDB();
    const auth = await getAuthUser();
    if (!auth?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const appId = String(body?.appId || "");
    const name = String(body?.name || "Untitled Workflow");

    const app = await NocodeApp.findOne({ _id: appId, userId: auth.userId });
    if (!app) return NextResponse.json({ error: "App not found" }, { status: 404 });

    const wf = await NocodeWorkflow.create({
      userId: auth.userId,
      appId,
      name,
      key: uniqueSlug(name),
      draftGraph: { nodes: [], edges: [] },
      publishedGraph: { nodes: [], edges: [], version: 0, publishedAt: null },
      status: "draft",
    });

    return NextResponse.json({ success: true, data: wf }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to create workflow" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    await connectDB();
    const auth = await getAuthUser();
    if (!auth?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const appId = url.searchParams.get("appId");
    const query: Record<string, unknown> = { userId: auth.userId };
    if (appId) query.appId = appId;

    const workflows = await NocodeWorkflow.find(query).sort({ updatedAt: -1 });
    return NextResponse.json({ success: true, data: workflows });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to list workflows" }, { status: 500 });
  }
}
```

Create app/api/nocode/workflows/[id]/route.ts:

```ts
import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConnect";
import { getAuthUser } from "@/lib/authUser";
import NocodeWorkflow from "@/lib/models/NocodeWorkflow";

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const auth = await getAuthUser();
    if (!auth?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;
    const wf = await NocodeWorkflow.findOne({ _id: id, userId: auth.userId });
    if (!wf) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ success: true, data: wf });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch workflow" }, { status: 500 });
  }
}

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const auth = await getAuthUser();
    if (!auth?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;
    const body = await req.json();

    const wf = await NocodeWorkflow.findOneAndUpdate(
      { _id: id, userId: auth.userId },
      {
        $set: {
          name: typeof body?.name === "string" ? body.name : undefined,
          "draftGraph.nodes": Array.isArray(body?.draftGraph?.nodes) ? body.draftGraph.nodes : [],
          "draftGraph.edges": Array.isArray(body?.draftGraph?.edges) ? body.draftGraph.edges : [],
          updatedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!wf) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ success: true, data: wf });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to save workflow" }, { status: 500 });
  }
}
```

Create app/api/nocode/workflows/[id]/publish/route.ts:

```ts
import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConnect";
import { getAuthUser } from "@/lib/authUser";
import NocodeWorkflow from "@/lib/models/NocodeWorkflow";
import { nextVersion } from "@/lib/nocode/versioning";

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const auth = await getAuthUser();
    if (!auth?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;
    const wf = await NocodeWorkflow.findOne({ _id: id, userId: auth.userId });
    if (!wf) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const version = nextVersion(wf.publishedGraph?.version);

    wf.publishedGraph = {
      nodes: wf.draftGraph?.nodes ?? [],
      edges: wf.draftGraph?.edges ?? [],
      version,
      publishedAt: new Date(),
    };

    wf.status = "published";
    wf.updatedAt = new Date();
    await wf.save();

    return NextResponse.json({ success: true, data: wf });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to publish workflow" }, { status: 500 });
  }
}
```

### 11.2 Workflow editor UI

Create components/nocode/workflow/WorkflowEditor.tsx:

```tsx
"use client";

import { useCallback } from "react";
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  useEdgesState,
  useNodesState,
  Connection,
  Edge,
} from "reactflow";
import "reactflow/dist/style.css";

type Props = {
  initialNodes: any[];
  initialEdges: any[];
  onSave: (graph: { nodes: any[]; edges: any[] }) => Promise<void>;
  onPublish: () => Promise<void>;
};

export default function WorkflowEditor({ initialNodes, initialEdges, onSave, onPublish }: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges || []);

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div style={{ height: "80vh", border: "1px solid #ddd" }}>
      <div style={{ padding: 8, display: "flex", gap: 8 }}>
        <button
          onClick={() =>
            setNodes((prev) => [
              ...prev,
              {
                id: String(Date.now()),
                position: { x: 100 + prev.length * 30, y: 100 + prev.length * 20 },
                data: { label: "Trigger: Form Submit", type: "trigger.formSubmit" },
                type: "default",
              },
            ])
          }
        >
          Add Trigger
        </button>

        <button
          onClick={() =>
            setNodes((prev) => [
              ...prev,
              {
                id: String(Date.now()),
                position: { x: 320 + prev.length * 30, y: 260 + prev.length * 20 },
                data: { label: "Action: Webhook", type: "action.webhook" },
                type: "default",
              },
            ])
          }
        >
          Add Action
        </button>

        <button onClick={() => void onSave({ nodes, edges })}>Save</button>
        <button onClick={() => void onPublish()}>Publish</button>
      </div>

      <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} fitView>
        <MiniMap />
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
}
```

Create app/nocode/workflows/[workflowId]/page.tsx:

```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";

const WorkflowEditor = dynamic(() => import("@/components/nocode/workflow/WorkflowEditor"), {
  ssr: false,
});

export default function WorkflowBuilderPage() {
  const params = useParams();
  const workflowId = useMemo(() => {
    const id = params?.workflowId;
    return Array.isArray(id) ? id[0] : (id as string);
  }, [params]);

  const [loading, setLoading] = useState(true);
  const [workflow, setWorkflow] = useState<any>(null);

  useEffect(() => {
    if (!workflowId) return;

    const load = async () => {
      try {
        const res = await fetch(`/api/nocode/workflows/${workflowId}`);
        const json = await res.json();
        setWorkflow(json?.data || null);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [workflowId]);

  if (loading) return <div>Loading workflow...</div>;
  if (!workflow) return <div>Workflow not found</div>;

  return (
    <div style={{ padding: 12 }}>
      <h1>{workflow.name}</h1>
      <WorkflowEditor
        initialNodes={workflow?.draftGraph?.nodes || []}
        initialEdges={workflow?.draftGraph?.edges || []}
        onSave={async (draftGraph) => {
          await fetch(`/api/nocode/workflows/${workflowId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ draftGraph }),
          });
        }}
        onPublish={async () => {
          await fetch(`/api/nocode/workflows/${workflowId}/publish`, { method: "POST" });
          alert("Workflow published");
        }}
      />
    </div>
  );
}
```

## 12. Workflow Compiler

Create lib/nocode/workflowCompiler.ts:

```ts
export type FlowNode = {
  id: string;
  data?: { type?: string; config?: Record<string, unknown> };
};

export type FlowEdge = {
  id?: string;
  source: string;
  target: string;
};

export type CompiledWorkflow = {
  orderedNodeIds: string[];
  nodeMap: Record<string, FlowNode>;
  outgoing: Record<string, string[]>;
};

export function compileWorkflow(nodes: FlowNode[], edges: FlowEdge[]): CompiledWorkflow {
  const nodeMap: Record<string, FlowNode> = {};
  const indegree: Record<string, number> = {};
  const outgoing: Record<string, string[]> = {};

  for (const n of nodes) {
    nodeMap[n.id] = n;
    indegree[n.id] = 0;
    outgoing[n.id] = [];
  }

  for (const e of edges) {
    if (!nodeMap[e.source] || !nodeMap[e.target]) continue;
    outgoing[e.source].push(e.target);
    indegree[e.target] += 1;
  }

  const queue: string[] = Object.keys(indegree).filter((k) => indegree[k] === 0);
  const ordered: string[] = [];

  while (queue.length > 0) {
    const id = queue.shift() as string;
    ordered.push(id);

    for (const nxt of outgoing[id]) {
      indegree[nxt] -= 1;
      if (indegree[nxt] === 0) queue.push(nxt);
    }
  }

  if (ordered.length !== nodes.length) {
    throw new Error("Workflow graph has a cycle or disconnected invalid state");
  }

  return {
    orderedNodeIds: ordered,
    nodeMap,
    outgoing,
  };
}
```

## 13. Runtime Actions and Conditions

Create lib/nocode/runtimeConditions.ts:

```ts
export async function evaluateCondition(
  conditionKey: string,
  input: Record<string, unknown>
): Promise<boolean> {
  if (conditionKey === "always") return true;

  if (conditionKey === "hasEmail") {
    const email = input?.email;
    return typeof email === "string" && email.includes("@");
  }

  return false;
}
```

Create lib/nocode/runtimeActions.ts:

```ts
export async function runAction(
  actionType: string,
  config: Record<string, unknown>,
  context: Record<string, unknown>
): Promise<Record<string, unknown>> {
  if (actionType === "action.webhook") {
    const url = String(config?.url || "");
    if (!url) throw new Error("Missing webhook url");

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ context }),
    });

    return {
      status: res.status,
      ok: res.ok,
    };
  }

  if (actionType === "action.log") {
    return { logged: true, message: String(config?.message || "log") };
  }

  throw new Error(`Unsupported action type: ${actionType}`);
}
```

## 14. Workflow Runtime Executor

Create lib/nocode/workflowRuntime.ts:

```ts
import NocodeRun from "@/lib/models/NocodeRun";
import NocodeWorkflow from "@/lib/models/NocodeWorkflow";
import { compileWorkflow } from "@/lib/nocode/workflowCompiler";
import { runAction } from "@/lib/nocode/runtimeActions";
import { evaluateCondition } from "@/lib/nocode/runtimeConditions";

export async function executeWorkflowRun(params: {
  runId: string;
  workflowId: string;
  appId: string;
  triggerPayload: Record<string, unknown>;
}) {
  const run = await NocodeRun.findById(params.runId);
  if (!run) throw new Error("Run not found");

  run.status = "running";
  run.startedAt = new Date();
  await run.save();

  try {
    const workflow = await NocodeWorkflow.findById(params.workflowId);
    if (!workflow || workflow.status !== "published") {
      throw new Error("Published workflow not found");
    }

    const nodes = workflow.publishedGraph?.nodes || [];
    const edges = workflow.publishedGraph?.edges || [];

    const compiled = compileWorkflow(nodes, edges);

    const executionContext: Record<string, unknown> = {
      trigger: params.triggerPayload,
      steps: {},
    };

    for (const nodeId of compiled.orderedNodeIds) {
      const node = compiled.nodeMap[nodeId];
      const nodeType = String(node?.data?.type || "");
      const config = (node?.data?.config || {}) as Record<string, unknown>;

      const startedAt = new Date();

      try {
        let output: Record<string, unknown> = {};

        if (nodeType.startsWith("trigger.")) {
          output = { accepted: true };
        } else if (nodeType.startsWith("condition.")) {
          const pass = await evaluateCondition(String(config?.key || "always"), {
            ...(params.triggerPayload || {}),
            executionContext,
          });
          output = { pass };
        } else if (nodeType.startsWith("action.")) {
          output = await runAction(nodeType, config, executionContext);
        } else {
          throw new Error(`Unknown node type: ${nodeType}`);
        }

        (executionContext.steps as Record<string, unknown>)[nodeId] = output;

        run.stepLogs.push({
          nodeId,
          nodeType,
          status: "success",
          input: { config },
          output,
          error: "",
          startedAt,
          endedAt: new Date(),
        });
      } catch (nodeError) {
        run.stepLogs.push({
          nodeId,
          nodeType,
          status: "failed",
          input: { config },
          output: {},
          error: nodeError instanceof Error ? nodeError.message : "Unknown node error",
          startedAt,
          endedAt: new Date(),
        });

        throw nodeError;
      }
    }

    run.status = "success";
    run.finishedAt = new Date();
    await run.save();
  } catch (error) {
    run.status = "failed";
    run.error = error instanceof Error ? error.message : "Workflow execution failed";
    run.finishedAt = new Date();
    await run.save();
  }
}
```

## 15. Trigger API (Form Submit)

Create app/api/nocode/trigger/form-submit/route.ts:

```ts
import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConnect";
import NocodeWorkflow from "@/lib/models/NocodeWorkflow";
import NocodeRun from "@/lib/models/NocodeRun";
import { executeWorkflowRun } from "@/lib/nocode/workflowRuntime";

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();
    const appId = String(body?.appId || "");
    const workflowKey = String(body?.workflowKey || "");
    const formData = (body?.formData || {}) as Record<string, unknown>;

    const workflow = await NocodeWorkflow.findOne({ appId, key: workflowKey, status: "published" });
    if (!workflow) {
      return NextResponse.json({ error: "Published workflow not found" }, { status: 404 });
    }

    const run = await NocodeRun.create({
      appId,
      workflowId: workflow._id,
      triggerType: "form.submit",
      triggerPayload: formData,
      status: "queued",
      stepLogs: [],
    });

    // MVP: execute in-process. Later move to queue worker.
    void executeWorkflowRun({
      runId: String(run._id),
      workflowId: String(workflow._id),
      appId,
      triggerPayload: formData,
    });

    return NextResponse.json({ success: true, runId: run._id }, { status: 202 });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to trigger workflow" }, { status: 500 });
  }
}
```

## 16. Run Logs API

Create app/api/nocode/runs/route.ts:

```ts
import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConnect";
import { getAuthUser } from "@/lib/authUser";
import NocodeRun from "@/lib/models/NocodeRun";

export async function GET(req: Request) {
  try {
    await connectDB();
    const auth = await getAuthUser();
    if (!auth?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const appId = url.searchParams.get("appId");

    const query: Record<string, unknown> = {};
    if (appId) query.appId = appId;

    const runs = await NocodeRun.find(query).sort({ createdAt: -1 }).limit(100);
    return NextResponse.json({ success: true, data: runs });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to list runs" }, { status: 500 });
  }
}
```

Create app/api/nocode/runs/[id]/route.ts:

```ts
import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConnect";
import { getAuthUser } from "@/lib/authUser";
import NocodeRun from "@/lib/models/NocodeRun";

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const auth = await getAuthUser();
    if (!auth?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;
    const run = await NocodeRun.findById(id);
    if (!run) return NextResponse.json({ error: "Run not found" }, { status: 404 });

    return NextResponse.json({ success: true, data: run });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch run" }, { status: 500 });
  }
}
```

## 17. Form -> Workflow Binding in Published Pages

You need client-side script for published forms. Add this script in public page route after html render.

Update app/p/[slug]/page.tsx by injecting minimal script block:

```tsx
<script
  dangerouslySetInnerHTML={{
    __html: `
(function () {
  async function onSubmit(e) {
    const form = e.target;
    if (!form || !form.matches('form[data-workflow-key]')) return;
    e.preventDefault();

    const workflowKey = form.getAttribute('data-workflow-key') || '';
    const appId = form.getAttribute('data-app-id') || '';

    const data = {};
    const fd = new FormData(form);
    for (const [k, v] of fd.entries()) data[k] = v;

    await fetch('/api/nocode/trigger/form-submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appId, workflowKey, formData: data })
    });
  }

  document.addEventListener('submit', onSubmit);
})();
`,
  }}
/>
```

When authoring form blocks in GrapesJS, set:
1. data-workflow-key
2. data-app-id

## 18. Builder Home Screen

Create app/nocode/apps/page.tsx for basic operator flow:

```tsx
"use client";

import { useEffect, useState } from "react";

export default function NocodeAppsPage() {
  const [apps, setApps] = useState<any[]>([]);
  const [name, setName] = useState("My App");

  const load = async () => {
    const res = await fetch("/api/nocode/apps");
    const json = await res.json();
    setApps(json?.data || []);
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <main style={{ padding: 16 }}>
      <h1>No-code Apps</h1>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input value={name} onChange={(e) => setName(e.target.value)} />
        <button
          onClick={async () => {
            await fetch("/api/nocode/apps", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name }),
            });
            await load();
          }}
        >
          Create App
        </button>
      </div>

      <ul>
        {apps.map((a) => (
          <li key={a._id}>
            {a.name} ({a.key})
          </li>
        ))}
      </ul>
    </main>
  );
}
```

## 19. Access Control Rules You Must Enforce

Always enforce these:
1. Private create/update/list routes require authenticated user
2. Query by both _id and userId for private resources
3. Public page route reads only published version
4. Trigger route accepts only published workflows
5. Never execute workflow drafts in production

## 20. Validation Rules

Add zod validation in each API route for:
1. appId, pageId, workflowId format and required state
2. max length for names and keys
3. max payload size for formData
4. allowed action types and condition keys

## 21. Security Hardening Before Launch

Mandatory:
1. sanitize-html for public render content
2. block script tags and dangerous URL schemes
3. rate-limit trigger endpoint
4. store secrets outside workflow configs
5. restrict outbound webhook domains if possible

## 22. Queue Worker Upgrade (Phase 2)

Move in-process execution to BullMQ worker:
1. Trigger API enqueues runId
2. Worker process dequeues and calls executeWorkflowRun
3. Add retry count and dead letter queue

This avoids API timeout and improves reliability.

## 23. Testing Checklist

Run these scenarios in order:
1. Create app -> success
2. Create page inside app -> success
3. Open builder and save draft -> draft persists
4. Publish page -> public slug renders
5. Create workflow -> save -> publish
6. Attach workflow key to form in page
7. Submit public form -> run created
8. Run transitions queued -> running -> success
9. Force webhook failure -> run marked failed
10. Verify stepLogs capture node-level error

## 24. Minimum Observability

Add these now:
1. run.status counters
2. avg execution duration
3. failed action type count
4. trigger endpoint request count

## 25. Production Rollout Plan

1. Deploy with workflows disabled by default
2. Enable only action.log and action.webhook first
3. Monitor run failures for 1 week
4. Enable email or DB write actions after stability
5. Add tenant quotas and billing limits

## 26. What You Have After This Guide

After implementing all steps above, you will have:
1. Bubble-like visual page builder
2. Workflow orchestration for backend-like automation
3. Publish and version model
4. Triggered workflow runtime with logs
5. Foundation to expand into full no-code platform

## 27. Immediate Next Enhancements

Implement in this order:
1. Property inspector panel for selected node config
2. Conditional branch node with true/false edge paths
3. Data model builder and generated CRUD actions
4. App variables and secrets manager
5. Reusable workflow templates

## 28. Sidebar Entry Integration (Open Builder by Click)

This section makes the Website Builder visible in your sidebar so users can open it in one click.

Your repo contains two sidebar implementations:
1. components/app-sidebar.tsx (shadcn sidebar)
2. components/Sidebar.tsx (custom animated sidebar)

Add the entry in the one your app currently renders. If both are used in different layouts, apply both.

### 28.1 Add Website Builder entry in components/app-sidebar.tsx

Open components/app-sidebar.tsx and add one item to data.navMain.

Important: do not use url: "#" for this item, because components/nav-main.tsx converts "#" items into /page/<title> routes.
Use direct route url: "/nocode/apps".

Example update:

```ts
const data = {
  // ...
  navMain: [
    {
      title: "Dashboard",
      url: "#",
      icon: <LayoutDashboardIcon />,
    },
    // Add this entry
    {
      title: "Website Builder",
      url: "/nocode/apps",
      icon: <CommandIcon />,
    },
    {
      title: "Projects",
      url: "#",
      icon: <FolderIcon />,
    },
  ],
  // ...
};
```

Result:
1. User clicks Website Builder in sidebar
2. App opens /nocode/apps
3. User creates app/page
4. User opens editor at /nocode/builder/[pageId]

### 28.2 Add Website Builder entry in components/Sidebar.tsx

In your custom Sidebar.tsx, the menu is built from menuItems.

Option A (recommended): add a direct quick-link button without changing MenuKey union.

1. Find const menuItems declaration.
2. Above the mapped menu list UI, add a button that navigates to /nocode/apps.

Example button snippet:

```tsx
<button
  type="button"
  onClick={() => navigateTo("/nocode/apps")}
  className={`w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${hoverClass}`}
>
  <Globe size={open ? 20 : 22} />
  {open && <span>Website Builder</span>}
</button>
```

This avoids changing MenuKey types and avoids side effects in create-page modal logic.

Option B (if you want it as a normal menu item):
1. Extend MenuKey type with "website-builder"
2. Add one menuItems entry:

```ts
{ key: "website-builder", label: "Website Builder", path: "/nocode/apps", icon: <Globe size={open?20:22}/> }
```

3. If needed, exclude this key from page-creation plus-button logic where you currently check specific keys.

### 28.3 Verify Sidebar Navigation Works

After adding entry:
1. Start app with npm run dev
2. Click Website Builder in sidebar
3. Confirm route opens /nocode/apps
4. Create app, then create page
5. Confirm editor opens /nocode/builder/[pageId]

If it does, sidebar integration is complete.

## 29. User Navigation Flow (Final)

The end-user path should be:
1. Sidebar -> Website Builder (/nocode/apps)
2. Create app
3. Create page
4. Open builder (/nocode/builder/[pageId])
5. Save draft
6. Publish
7. Open live page (/p/[slug])
