// app/api/databases/[id]/settings/route.ts
import { NextResponse } from "next/server";
import dbConnect from "../../../../../lib/dbConnect";
import Database from "../../../../../lib/models/Database";
import { getAuthUser } from "../../../../../lib/authUser";

/**
 * PATCH /api/databases/:id/settings
 *
 * Saves view-level settings: filters, sorts, hiddenProperties, groupBy, layout.
 * These are stored on the `settings` field of the Database document.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const authUser = await getAuthUser();
    
    if (!authUser?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    // Only allow specific setting keys — guard against overwriting core fields
    const allowed = ["filters", "sorts", "hiddenProperties", "groupBy", "layout", "conditionalColors"];
    const patch: Record<string, unknown> = {};

    for (const key of allowed) {
      if (key in body) {
        patch[`settings.${key}`] = body[key];
      }
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "No valid settings keys provided" }, { status: 400 });
    }

    const db = await Database.findOneAndUpdate(
      { _id: id, userId: authUser.userId },
      { $set: patch },
      { new: true }
    );

    if (!db) {
      return NextResponse.json({ error: "Database not found" }, { status: 404 });
    }

    return NextResponse.json(db);
  } catch (err) {
    console.error("PATCH /api/databases/[id]/settings error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/databases/:id/settings
 *
 * Returns the `settings` sub-object for a single database.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const authUser = await getAuthUser();
    
    if (!authUser?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const db = await Database.findOne({ _id: id, userId: authUser.userId }).select("settings").lean();
    if (!db) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json((db as any).settings ?? {});
  } catch (err) {
    console.error("GET /api/databases/[id]/settings error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}