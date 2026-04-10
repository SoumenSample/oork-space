import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConnect";
import { getAuthUser } from "@/lib/authUser";
import NocodePage from "@/lib/models/NocodePage";
import { nextVersion } from "@/lib/nocode/versioning";
import { cleanBuilderCss, cleanBuilderHtml } from "@/lib/nocode/cleanExport";

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
    const html = cleanBuilderHtml(page.draft?.html ?? "");
    const css = cleanBuilderCss(page.draft?.css ?? "");

    page.published = {
      grapesProjectData: page.draft?.grapesProjectData ?? null,
      html,
      css,
      js: page.draft?.js ?? "",
      bindings: page.draft?.bindings ?? [],
      seo: page.draft?.seo ?? {
        title: "",
        description: "",
        ogTitle: "",
        ogDescription: "",
        ogImage: "",
      },
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