import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import dbConnect from "@/lib/dbConnect";
import User from "@/lib/models/User";
import { verifyToken } from "@/lib/jwt";

interface TokenPayload {
  userId?: string;
}

async function getAuthedUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) return null;

  try {
    const decoded = verifyToken(token) as TokenPayload;
    return decoded?.userId ?? null;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const userId = await getAuthedUserId();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findById(userId).select("_id name email createdAt");

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name || "",
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const userId = await getAuthedUserId();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const name = typeof body?.name === "string" ? body.name.trim() : undefined;
    const rawEmail = typeof body?.email === "string" ? body.email.trim().toLowerCase() : undefined;

    if (name === undefined && rawEmail === undefined) {
      return NextResponse.json({ message: "Nothing to update" }, { status: 400 });
    }

    if (name !== undefined && !name) {
      return NextResponse.json({ message: "Name cannot be empty" }, { status: 400 });
    }

    if (rawEmail !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(rawEmail)) {
        return NextResponse.json({ message: "Invalid email format" }, { status: 400 });
      }
    }

    await dbConnect();
    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (rawEmail && rawEmail !== user.email) {
      const existing = await User.findOne({ email: rawEmail, _id: { $ne: user._id } }).select("_id");
      if (existing) {
        return NextResponse.json({ message: "Email already in use" }, { status: 409 });
      }
      user.email = rawEmail;
    }

    if (name !== undefined) {
      user.name = name;
    }

    await user.save();

    return NextResponse.json({
      message: "Profile updated",
      user: {
        id: user._id.toString(),
        name: user.name || "",
        email: user.email,
      },
    });
  } catch {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
