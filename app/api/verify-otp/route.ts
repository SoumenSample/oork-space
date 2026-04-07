import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/lib/models/User";

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json();
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedOtp = String(otp || "").trim();
    console.log(email,otp);

    if (!normalizedEmail || !normalizedOtp) {
      return NextResponse.json(
        { success: false, message: "Email and OTP required" },
        { status: 400 }
      );
    }

    await dbConnect();

    const user = await User.findOne({ email: normalizedEmail });
    console.log(user);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    if (user.isVerified) {
      return NextResponse.json({ success: true, message: "Email already verified" });
    }

    if (!user.otp) {
      return NextResponse.json(
        { success: false, message: "OTP not generated for this account. Please sign up again." },
        { status: 400 }
      );
    }

    if (user.otp !== normalizedOtp) {
      console.log(user.otp, normalizedOtp);
      return NextResponse.json(
        { success: false, message: "Invalid OTP" },
        { status: 400 }
      );
    }

    if (!user.otpExpiry || user.otpExpiry < new Date()) {
      return NextResponse.json(
        { success: false, message: "OTP expired" },
        { status: 400 }
      );
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    return NextResponse.json({ success: true, message: "OTP verified. Account created successfully." });
  } catch (error) {
    console.error("VERIFY OTP ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}