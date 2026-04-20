import { NextRequest, NextResponse } from "next/server";

import dbConnect from "@/lib/dbConnect";
import { verifyToken } from "@/lib/jwt";
import GalleryItem from "@/lib/models/GalleryItem";

const PROJECT_AUTH_COOKIE_NAME = "project_auth_token";

type ProjectTokenPayload = {
  scope?: string;
  tableUserId?: string;
  appId?: string;
  databaseId?: string;
};

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(PROJECT_AUTH_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token) as ProjectTokenPayload;
    if (
      decoded?.scope !== "project-table-user"
      || !decoded?.tableUserId
      || !decoded?.appId
      || !decoded?.databaseId
    ) {
      return NextResponse.json({ success: false, message: "Invalid token" }, { status: 401 });
    }

    await dbConnect();

    const tableUser = await GalleryItem.findOne({
      _id: decoded.tableUserId,
      databaseId: decoded.databaseId,
    }).select("_id values");

    if (!tableUser) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const values = (tableUser?.values && typeof tableUser.values === "object")
      ? (tableUser.values as Record<string, unknown>)
      : {};

    const isVerified = typeof values.__auth_isVerified === "boolean"
      ? values.__auth_isVerified
      : (typeof values.isVerified === "boolean" ? values.isVerified : false);

    if (!isVerified) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      projectUser: {
        id: String(tableUser._id),
        appId: String(decoded.appId),
        databaseId: String(decoded.databaseId),
        name: String(values.name || ""),
        email: String(values.email || ""),
      },
    });
  } catch {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
}
