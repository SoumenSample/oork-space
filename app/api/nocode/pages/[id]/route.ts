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