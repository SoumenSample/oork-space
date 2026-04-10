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