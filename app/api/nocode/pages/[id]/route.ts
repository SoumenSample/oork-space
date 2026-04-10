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
    const draft = (body?.draft && typeof body.draft === "object") ? body.draft : null;

    const seo = (draft?.seo && typeof draft.seo === "object")
      ? draft.seo as Record<string, unknown>
      : null;

    const page = await NocodePage.findOne({ _id: id, userId: auth.userId });

    if (!page) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (typeof body?.name === "string" && body.name.trim()) {
      page.name = body.name;
    }

    if (draft) {
      if (Object.prototype.hasOwnProperty.call(draft, "grapesProjectData") && draft.grapesProjectData !== undefined) {
        page.draft.grapesProjectData = draft.grapesProjectData;
        page.markModified("draft.grapesProjectData");
      }

      if (typeof draft.html === "string") {
        page.draft.html = draft.html;
        page.markModified("draft.html");
      }

      if (typeof draft.css === "string") {
        page.draft.css = draft.css;
        page.markModified("draft.css");
      }

      if (typeof draft.js === "string") {
        page.draft.js = draft.js;
        page.markModified("draft.js");
      }

      if (Array.isArray(draft.bindings)) {
        page.draft.bindings = draft.bindings;
        page.markModified("draft.bindings");
      }

      if (seo) {
        page.draft.seo = {
          title: typeof seo.title === "string" ? seo.title : "",
          description: typeof seo.description === "string" ? seo.description : "",
          ogTitle: typeof seo.ogTitle === "string" ? seo.ogTitle : "",
          ogDescription: typeof seo.ogDescription === "string" ? seo.ogDescription : "",
          ogImage: typeof seo.ogImage === "string" ? seo.ogImage : "",
        };
        page.markModified("draft.seo");
      }
    }

    page.updatedAt = new Date();
    await page.save();

    return NextResponse.json({ success: true, data: page });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to save page" }, { status: 500 });
  }
}