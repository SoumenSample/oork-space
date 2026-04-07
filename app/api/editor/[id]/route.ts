// import { NextResponse } from "next/server";
// import connectDB from "@/lib/dbConnect";
// import Editor from "../../../../lib/models/Editor";

// export async function GET(
//   req: Request,
//   { params }: { params: { id: string } }
// ) {
//   await connectDB();

//   const data = await Editor.findById(params.id);

//   return NextResponse.json(data);
// }
import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConnect";
import Editor from "../../../../lib/models/Editor";
import { getAuthUser } from "@/lib/authUser";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await context.params;

    console.log("ID:", id);

    const data = await Editor.findById(id);

    if (!data) {
      return NextResponse.json(
        { message: "Not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.log("ERROR:", error);

    return NextResponse.json(
      { error: "Server error" },
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

    // Find existing or create new
    let editor = await Editor.findById(id);

    if (!editor) {
      editor = await Editor.create({
        _id: id,
        userId: authUser.userId,
        content: body,
      });
    } else {
      editor.content = body;
      editor.updatedAt = new Date();
      await editor.save();
    }

    return NextResponse.json(editor);
  } catch (error) {
    console.error("PUT /api/editor/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to save" },
      { status: 500 }
    );
  }
}