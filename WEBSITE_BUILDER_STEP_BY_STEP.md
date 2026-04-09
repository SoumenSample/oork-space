# Website Builder Integration (Step-by-Step)

This guide adds a full MVP website builder to your Next.js project using Craft.js.

Outcome after completing all steps:
1. Visual editor at `/builder/[id]`
2. Draft autosave to MongoDB
3. Publish action
4. Public page rendering at `/site/[slug]`

---

## 0) Prerequisites

1. Ensure your MongoDB URI is configured in `.env.local`.
2. Ensure auth cookie flow is already working (you already use `getAuthUser`).
3. Confirm existing project runs:
   - `npm run dev`

Example env value:

```env
MONGO_URI=mongodb://127.0.0.1:27017/multi-tasking
```

---

## 1) Install Required Packages

Run:

```bash
npm i @craftjs/core @craftjs/utils
```

Notes:
1. `@craftjs/core` powers editor and serialized node tree.
2. `@craftjs/utils` helps with utilities as you scale builder features.

---

## 2) Create Website Page Model

Create file: `lib/models/WebsitePage.ts`

```ts
import mongoose from "mongoose";

const WebsitePageSchema = new mongoose.Schema(
  {
    userId: { type: String, index: true, required: true },
    title: { type: String, required: true, default: "Untitled Page" },
    slug: { type: String, required: true, unique: true, index: true },

    // Craft.js serialized node tree
    draftContent: { type: mongoose.Schema.Types.Mixed, default: null },
    publishedContent: { type: mongoose.Schema.Types.Mixed, default: null },

    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },

    seo: {
      title: { type: String, default: "" },
      description: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

if (process.env.NODE_ENV !== "production") {
  delete mongoose.models.WebsitePage;
}

export default mongoose.models.WebsitePage ||
  mongoose.model("WebsitePage", WebsitePageSchema);
```

Why this model shape:
1. `draftContent` stores work-in-progress.
2. `publishedContent` stores live version.
3. `status` keeps publish state explicit.
4. `slug` enables public URL routes.

---

## 3) Create Slug Utility

Create file: `lib/slug.ts`

```ts
export function slugifyTitle(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function uniqueSlug(base: string): string {
  const cleaned = slugifyTitle(base || "untitled-page");
  const suffix = Math.random().toString(36).slice(2, 7);
  return cleaned ? `${cleaned}-${suffix}` : `page-${suffix}`;
}
```

Why:
1. Avoid slug collisions.
2. Keep URL-safe route strings.

---

## 4) Create API: List and Create Pages

Create file: `app/api/site-builder/route.ts`

```ts
import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConnect";
import WebsitePage from "@/lib/models/WebsitePage";
import { getAuthUser } from "@/lib/authUser";
import { uniqueSlug } from "@/lib/slug";

export async function POST(req: Request) {
  try {
    await connectDB();

    const authUser = await getAuthUser();
    if (!authUser?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const title = String(body?.title || "Untitled Page");

    const doc = await WebsitePage.create({
      userId: authUser.userId,
      title,
      slug: uniqueSlug(title),
      draftContent: body?.draftContent ?? null,
      publishedContent: null,
      status: "draft",
      seo: {
        title: "",
        description: "",
      },
    });

    return NextResponse.json({ success: true, data: doc }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to create page" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectDB();

    const authUser = await getAuthUser();
    if (!authUser?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pages = await WebsitePage.find({ userId: authUser.userId }).sort({
      updatedAt: -1,
    });

    return NextResponse.json({ success: true, data: pages });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch pages" },
      { status: 500 }
    );
  }
}
```

---

## 5) Create API: Get and Save Draft by ID

Create file: `app/api/site-builder/[id]/route.ts`

```ts
import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConnect";
import WebsitePage from "@/lib/models/WebsitePage";
import { getAuthUser } from "@/lib/authUser";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const authUser = await getAuthUser();
    if (!authUser?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const page = await WebsitePage.findOne({ _id: id, userId: authUser.userId });

    if (!page) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: page });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch page" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const authUser = await getAuthUser();
    if (!authUser?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json();

    const updatePayload: {
      title?: string;
      draftContent?: unknown;
      seo?: { title?: string; description?: string };
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    if (typeof body?.title === "string") {
      updatePayload.title = body.title;
    }

    if (body?.draftContent !== undefined) {
      updatePayload.draftContent = body.draftContent;
    }

    if (body?.seo && typeof body.seo === "object") {
      updatePayload.seo = {
        title: typeof body.seo.title === "string" ? body.seo.title : "",
        description:
          typeof body.seo.description === "string" ? body.seo.description : "",
      };
    }

    const page = await WebsitePage.findOneAndUpdate(
      { _id: id, userId: authUser.userId },
      { $set: updatePayload },
      { new: true }
    );

    if (!page) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: page });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to save page" },
      { status: 500 }
    );
  }
}
```

---

## 6) Create API: Publish by ID

Create file: `app/api/site-builder/[id]/publish/route.ts`

```ts
import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConnect";
import WebsitePage from "@/lib/models/WebsitePage";
import { getAuthUser } from "@/lib/authUser";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const authUser = await getAuthUser();
    if (!authUser?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const page = await WebsitePage.findOne({ _id: id, userId: authUser.userId });
    if (!page) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    page.publishedContent = page.draftContent;
    page.status = "published";
    page.updatedAt = new Date();

    await page.save();

    return NextResponse.json({ success: true, data: page });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to publish page" },
      { status: 500 }
    );
  }
}
```

---

## 7) Create Starter Builder Blocks

Create folder: `components/website-builder/blocks`

Create file: `components/website-builder/blocks/ContainerBlock.tsx`

```tsx
"use client";

export function ContainerBlock({ children }: { children?: React.ReactNode }) {
  return (
    <section
      style={{
        padding: "24px",
        minHeight: "120px",
        border: "1px dashed #d1d5db",
        borderRadius: "10px",
      }}
    >
      {children}
    </section>
  );
}

(ContainerBlock as any).craft = {
  displayName: "Section",
  props: {},
};
```

Create file: `components/website-builder/blocks/TextBlock.tsx`

```tsx
"use client";

interface TextBlockProps {
  text: string;
  size?: number;
  align?: "left" | "center" | "right";
  color?: string;
}

export function TextBlock({
  text,
  size = 18,
  align = "left",
  color = "#111827",
}: TextBlockProps) {
  return (
    <p style={{ fontSize: `${size}px`, textAlign: align, color, margin: 0 }}>{text}</p>
  );
}

(TextBlock as any).craft = {
  displayName: "Text",
  props: {
    text: "Edit this text",
    size: 18,
    align: "left",
    color: "#111827",
  },
};
```

Create file: `components/website-builder/blocks/ButtonBlock.tsx`

```tsx
"use client";

interface ButtonBlockProps {
  label: string;
  href?: string;
  bg?: string;
  color?: string;
}

export function ButtonBlock({
  label,
  href = "#",
  bg = "#111827",
  color = "#ffffff",
}: ButtonBlockProps) {
  return (
    <a
      href={href}
      style={{
        display: "inline-block",
        padding: "10px 16px",
        borderRadius: "8px",
        background: bg,
        color,
        textDecoration: "none",
        fontWeight: 600,
      }}
    >
      {label}
    </a>
  );
}

(ButtonBlock as any).craft = {
  displayName: "Button",
  props: {
    label: "Click me",
    href: "#",
    bg: "#111827",
    color: "#ffffff",
  },
};
```

Create file: `components/website-builder/blocks/ImageBlock.tsx`

```tsx
"use client";

interface ImageBlockProps {
  src: string;
  alt?: string;
  radius?: number;
}

export function ImageBlock({ src, alt = "", radius = 10 }: ImageBlockProps) {
  return (
    <img
      src={src}
      alt={alt}
      style={{ width: "100%", maxWidth: "640px", borderRadius: `${radius}px` }}
    />
  );
}

(ImageBlock as any).craft = {
  displayName: "Image",
  props: {
    src: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1280",
    alt: "Placeholder",
    radius: 10,
  },
};
```

---

## 8) Create Builder UI Page

Create file: `app/builder/[id]/page.tsx`

```tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Editor, Frame, Element, useEditor } from "@craftjs/core";
import { useParams } from "next/navigation";

import { ContainerBlock } from "@/components/website-builder/blocks/ContainerBlock";
import { TextBlock } from "@/components/website-builder/blocks/TextBlock";
import { ButtonBlock } from "@/components/website-builder/blocks/ButtonBlock";
import { ImageBlock } from "@/components/website-builder/blocks/ImageBlock";

function TopBar({ pageId }: { pageId: string }) {
  const { query } = useEditor();
  const [saving, setSaving] = useState(false);
  const autosaveRef = useRef<NodeJS.Timeout | null>(null);

  const saveDraft = async () => {
    try {
      setSaving(true);
      const draftContent = query.serialize();

      await fetch(`/api/site-builder/${pageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draftContent }),
      });
    } finally {
      setSaving(false);
    }
  };

  const publish = async () => {
    await fetch(`/api/site-builder/${pageId}/publish`, { method: "POST" });
    alert("Published successfully");
  };

  // Simple autosave trigger on each render cycle; for production, optimize with onNodesChange.
  useEffect(() => {
    if (autosaveRef.current) {
      clearTimeout(autosaveRef.current);
    }

    autosaveRef.current = setTimeout(() => {
      void saveDraft();
    }, 1200);

    return () => {
      if (autosaveRef.current) {
        clearTimeout(autosaveRef.current);
      }
    };
  });

  return (
    <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
      <button onClick={() => void saveDraft()}>{saving ? "Saving..." : "Save Draft"}</button>
      <button onClick={() => void publish()}>Publish</button>
    </div>
  );
}

export default function BuilderPage() {
  const params = useParams();
  const pageId = useMemo(() => {
    const value = params?.id;
    return Array.isArray(value) ? value[0] : (value as string);
  }, [params]);

  const [initialTree, setInitialTree] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!pageId) return;

    const load = async () => {
      try {
        const res = await fetch(`/api/site-builder/${pageId}`);
        const json = await res.json();

        const draft = json?.data?.draftContent;
        setInitialTree(typeof draft === "string" ? draft : null);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [pageId]);

  if (!pageId) return null;
  if (loading) return <div style={{ padding: "16px" }}>Loading builder...</div>;

  return (
    <div style={{ padding: "16px" }}>
      <h1 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "12px" }}>
        Website Builder
      </h1>

      <Editor resolver={{ ContainerBlock, TextBlock, ButtonBlock, ImageBlock }}>
        <TopBar pageId={pageId} />

        <Frame data={initialTree || undefined}>
          <Element is={ContainerBlock} canvas>
            <TextBlock text="Your first section" />
            <ButtonBlock label="Get Started" href="#" />
          </Element>
        </Frame>
      </Editor>
    </div>
  );
}
```

---

## 9) Create Public Site Renderer Component

Create file: `components/website-builder/SiteRenderer.tsx`

```tsx
"use client";

import { Editor, Frame } from "@craftjs/core";

import { ContainerBlock } from "@/components/website-builder/blocks/ContainerBlock";
import { TextBlock } from "@/components/website-builder/blocks/TextBlock";
import { ButtonBlock } from "@/components/website-builder/blocks/ButtonBlock";
import { ImageBlock } from "@/components/website-builder/blocks/ImageBlock";

export default function SiteRenderer({ serialized }: { serialized: string }) {
  return (
    <Editor
      resolver={{ ContainerBlock, TextBlock, ButtonBlock, ImageBlock }}
      enabled={false}
    >
      <Frame data={serialized} />
    </Editor>
  );
}
```

---

## 10) Create Public Route by Slug

Create file: `app/site/[slug]/page.tsx`

```tsx
import { notFound } from "next/navigation";
import connectDB from "@/lib/dbConnect";
import WebsitePage from "@/lib/models/WebsitePage";
import SiteRenderer from "@/components/website-builder/SiteRenderer";

export default async function PublicSitePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await connectDB();

  const { slug } = await params;
  const page = await WebsitePage.findOne({ slug, status: "published" });

  if (!page || !page.publishedContent) {
    notFound();
  }

  return (
    <main style={{ padding: "24px" }}>
      <SiteRenderer serialized={page.publishedContent as string} />
    </main>
  );
}
```

---

## 11) Create a Page and Redirect to Builder

You need an entry point button from dashboard or any page.

Add this logic in your preferred component:

```tsx
const createWebsitePage = async () => {
  const res = await fetch("/api/site-builder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "My Landing Page" }),
  });

  const json = await res.json();
  const id = json?.data?._id;

  if (id) {
    window.location.href = `/builder/${id}`;
  }
};
```

Basic button:

```tsx
<button onClick={() => void createWebsitePage()}>Create Website</button>
```

---

## 12) Add a Page List Screen (Optional but Recommended)

Create route `app/builder/page.tsx` to list all website pages via `GET /api/site-builder`.

Minimum list should show:
1. title
2. slug
3. status
4. updated date
5. open builder button
6. open public URL button

---

## 13) Security Rules You Must Keep

1. Always check `getAuthUser()` in private routes.
2. Always scope private DB queries by both `_id` and `userId`.
3. Never return draft content from public slug route.
4. Public route must only use `status: "published"` and `publishedContent`.

---

## 14) Validation and Error Handling

Minimum checks to add as next hardening step:
1. `title` length limit (for example 120 chars).
2. `seo.title` and `seo.description` max lengths.
3. Route-level `try/catch` with clear JSON error messages.
4. Return `404` for missing page IDs and slugs.

---

## 15) Run and Verify

Run dev server:

```bash
npm run dev
```

Test sequence:
1. Trigger Create Website action.
2. Confirm redirect to `/builder/<id>`.
3. Edit content in builder.
4. Click Save Draft.
5. Refresh builder route and confirm draft persists.
6. Click Publish.
7. Open `/site/<slug>` and confirm rendered published version.
8. Make another draft edit without publishing.
9. Confirm public page still shows old published version.
10. Publish again and confirm public page updates.

---

## 16) Common Issues and Fixes

Issue: Unauthorized from API routes.
1. Confirm auth cookie `token` is set.
2. Confirm `getAuthUser()` works in server route context.

Issue: Mongo connection errors.
1. Confirm `MONGO_URI` in `.env.local`.
2. Restart dev server after env changes.

Issue: Nothing renders at `/site/[slug]`.
1. Confirm page status is `published`.
2. Confirm `publishedContent` is non-null.

Issue: Slug duplicate key errors.
1. Keep `uniqueSlug()` suffix logic.
2. Avoid manually forcing duplicate slug strings.

---

## 17) Upgrade Path After MVP

Recommended next milestones:
1. Add drag-and-drop toolbox panel.
2. Add right sidebar property inspector for selected block.
3. Add templates (Landing, Portfolio, SaaS).
4. Add revisions/history table.
5. Add collaborative editing with existing websocket/Yjs setup.
6. Add domain mapping and SEO settings UI.

---

## 18) Final Checklist

1. Installed Craft.js dependencies.
2. Added `WebsitePage` model.
3. Added slug utilities.
4. Added create/list API.
5. Added get/save API.
6. Added publish API.
7. Added block components.
8. Added builder page route.
9. Added site renderer component.
10. Added public slug route.
11. Added create-and-redirect entry action.
12. Verified save and publish behavior.

If all 12 are complete, your website builder MVP is integrated and working.
