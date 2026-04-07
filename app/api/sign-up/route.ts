import bcrypt from "bcryptjs";
import connectDB from "../../../lib/dbConnect";
import User from "../../../lib/models/User";
import { NextResponse } from "next/server";
import { sendEmailOTP } from "@/lib/mailer";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    const normalizedName = String(name || "").trim();
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const rawPassword = String(password || "");

    if (!normalizedName || !normalizedEmail || !rawPassword) {
      return NextResponse.json(
        { success: false, message: "Name, email and password are required" },
        { status: 400 }
      );
    }

    if (!/\S+@\S+\.\S+/.test(normalizedEmail)) {
      return NextResponse.json(
        { success: false, message: "Invalid email format" },
        { status: 400 }
      );
    }

    if (rawPassword.length < 6) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    await connectDB();

    // check existing user
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing?.isVerified) {
      return NextResponse.json(
        {
          success: false,
          message: "User already exists",
        },
        { status: 409 }
      );
    }

    // hash password
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    // generate OTP and expiry
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    if (existing && !existing.isVerified) {
      existing.name = normalizedName;
      existing.password = hashedPassword;
      existing.otp = otp;
      existing.otpExpiry = otpExpiry;
      await existing.save();
    } else {
      await User.create({
        name: normalizedName,
        email: normalizedEmail,
        password: hashedPassword,
        otp,
        otpExpiry,
        isVerified: false,
      });
    }

    const otpResult = await sendEmailOTP(normalizedEmail, otp);
    if (!otpResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to send OTP. Please try again.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "OTP sent to your email. Verify to complete account creation.",
      requiresOtp: true,
      email: normalizedEmail,
    });

  } catch (err) {
    return NextResponse.json({
      success: false,
      message: err instanceof Error ? err.message : "Server error",
    });
  }
}