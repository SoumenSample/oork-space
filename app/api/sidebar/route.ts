import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Page from "@/lib/models/Sidebar";

/* ================= GET ALL PAGES ================= */
export async function GET() {
  try {
    await dbConnect();
    const pages = await Page.find().sort({ createdAt: -1 });
    return NextResponse.json(pages, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { message: err.message || "Server error" },
      { status: 500 }
    );
  }
}

// /* ================= CREATE PAGE ================= */
// export async function POST(req: NextRequest) {
//   try {
//     await dbConnect();

//     const body = await req.json();
//     const { pageName, menuKey } = body;

//     if (!pageName || !menuKey) {
//       return NextResponse.json(
//         { message: "pageName and menuKey required" },
//         { status: 400 }
//       );
//     }

//     const page = await Page.create({
//       pageName,
//       menuKey,
//     });

//     return NextResponse.json(page, { status: 201 });
//   } catch (err: any) {
//     return NextResponse.json(
//       { message: err.message || "Server error" },
//       { status: 500 }
//     );
//   }
// }


export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json();
    const { pageName, menuKey, emoji } = body;

    if (!pageName || !menuKey) {
      return NextResponse.json(
        { message: "pageName and menuKey required" },
        { status: 400 }
      );
    }

    const page = await Page.create({
      pageName,
      menuKey,
      emoji: emoji || "📄",
    });

    return NextResponse.json(page, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { message: err.message || "Server error" },
      { status: 500 }
    );
  }
}

/* ================= UPDATE PAGE ================= */
export async function PATCH(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { message: "Page ID required" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { pageName, emoji } = body;

    const updateData: any = {};
    if (pageName !== undefined) updateData.pageName = pageName;
    if (emoji !== undefined) updateData.emoji = emoji;

    const updatedPage = await Page.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedPage) {
      return NextResponse.json(
        { message: "Page not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedPage, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { message: err.message || "Server error" },
      { status: 500 }
    );
  }
}

/* ================= DELETE PAGE ================= */
export async function DELETE(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { message: "Page ID required" },
        { status: 400 }
      );
    }

    const deletedPage = await Page.findByIdAndDelete(id);

    if (!deletedPage) {
      return NextResponse.json(
        { message: "Page not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Page deleted successfully", page: deletedPage },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { message: err.message || "Server error" },
      { status: 500 }
    );
  }
}
