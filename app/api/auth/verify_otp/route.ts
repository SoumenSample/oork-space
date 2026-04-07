import  dbConnect  from '@/lib/dbConnect';
import { NextResponse } from "next/server";

import User from "@/lib/models/User";
import { signToken } from "@/lib/jwt";

export async function POST(req: Request) {
  try {
    await dbConnect();

    const { email, otp } = await req.json();

    // validation
    if (!email || !otp) {
      return NextResponse.json(
        { error: "Email and OTP required" },
        { status: 400 }
      );
    }

    // find user
    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // already verified
    if (user.isVerified) {
      return NextResponse.json(
        { message: "Email already verified" },
        { status: 200 }
      );
    }

    // check OTP
    if (user.otp !== otp) {
      console.log("Invalid OTP attempt for email:", otp);
      console.log("Invalid OTP attempt for email:", user.otp);
      console.log("Invalid OTP attempt for email:", email);

      return NextResponse.json(
        { error: "Invalid OTP" },
        { status: 400 }
      );
    }

    // check expiry
    if (user.otpExpiry < new Date()) {
      return NextResponse.json(
        { error: "OTP expired" },
        { status: 400 }
      );
    }

    // verify user
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;

    await user.save();

    // generate JWT (auto login after verification)
    const token = signToken({
      userId: user._id,
      email: user.email,
    });

    // response
    const response = NextResponse.json({
      message: "Email verified successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });

    // set cookie
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("VERIFY OTP ERROR:", error);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}