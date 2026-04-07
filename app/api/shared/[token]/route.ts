import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConnect";
import Project from "@/lib/models/Project";
import { getAuthUser } from "@/lib/authUser";

// Get project by share token
export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  await connectDB();

  try {
    const { token } = await params;
    const authUser = await getAuthUser();
    const authEmail = String(authUser?.email || "").trim().toLowerCase();
    console.log("🔍 API: Looking for share token:", token);

    // Find project with this share token
    const project = await Project.findOne({
      "shareLinks.token": token,
    });

    console.log("📦 API: Found project:", project ? "Yes" : "No");

    if (!project) {
      console.error("❌ API: No project found with token:", token);
      return NextResponse.json(
        { error: "Invalid or expired share link" },
        { status: 404 }
      );
    }

    // Find the specific share link
    const shareLink = project.shareLinks?.find((link: any) => link.token === token);

    console.log("🔗 API: Found share link:", shareLink ? "Yes" : "No");

    if (!shareLink) {
      console.error("❌ API: Share link not found in project");
      return NextResponse.json(
        { error: "Share link not found" },
        { status: 404 }
      );
    }

    // Check if link has expired
    if (shareLink.expiresAt && new Date(shareLink.expiresAt) < new Date()) {
      console.error("❌ API: Share link expired");
      return NextResponse.json(
        { error: "Share link has expired" },
        { status: 410 }
      );
    }

    // If this logged-in user was invited by email, confirm collaboration acceptance.
    if (authEmail && Array.isArray(project.collaborators)) {
      const idx = project.collaborators.findIndex(
        (c: any) => String(c.email || "").toLowerCase() === authEmail
      );
      if (idx >= 0 && project.collaborators[idx].status === "pending") {
        project.collaborators[idx].status = "accepted";
        await project.save();
      }
    }

    console.log("✅ API: Returning project with permission:", shareLink.permission);

    return NextResponse.json({
      success: true,
      project: {
        _id: project._id,
        name: project.name,
        emoji: project.emoji,
      },
      permission: shareLink.permission,
      collaborators: Array.isArray(project.collaborators)
        ? project.collaborators.map((c: any) => ({
            email: c.email,
            role: c.role,
            status: c.status,
          }))
        : [],
    });
  } catch (error) {
    console.error("Shared project access error:", error);
    return NextResponse.json(
      { error: "Failed to access shared project" },
      { status: 500 }
    );
  }
}
