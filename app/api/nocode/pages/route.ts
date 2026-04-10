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
        seo: {
          title: "",
          description: "",
          ogTitle: "",
          ogDescription: "",
          ogImage: "",
        },
      },
      published: {
        grapesProjectData: null,
        html: "",
        css: "",
        js: "",
        bindings: [],
        seo: {
          title: "",
          description: "",
          ogTitle: "",
          ogDescription: "",
          ogImage: "",
        },
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