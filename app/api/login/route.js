import bcrypt from "bcryptjs";
import connectDB from "../../../lib/dbConnect";
import User from "../../../lib/models/User";
import { signToken } from "../../../lib/jwt";
import { NextResponse } from "next/server";

export async function POST(req) {
  const { email, password } = await req.json();

  await connectDB();

  const user = await User.findOne({ email });

  if (!user) {
    return Response.json({ success: false, message: "User not found" });
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return Response.json({ success: false, message: "Wrong password" });
  }

  if (!user.isVerified) {
    return Response.json({
      success: false,
      message: "Please verify OTP first to activate your account",
    });
  }

  const token = signToken({
    userId: user._id,
    email: user.email,
  });

  const response = NextResponse.json({
    success: true,
    message: "Login success",
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
    },
  });

  response.cookies.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return response;
}