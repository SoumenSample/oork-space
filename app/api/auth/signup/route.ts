import dbConnect  from '@/lib/dbConnect';
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import User from "@/lib/models/User";
import { signToken } from "@/lib/jwt";
import { sendEmailOTP } from '@/lib/mailer';

export async function POST(req: Request) {
  try {
    await dbConnect();

    const { name, email, password } = await req.json();

    // validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // check existing user
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 409 }
      );
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // generate OTP (6 digit)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // OTP expires in 10 minutes
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    // create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      otp,
      otpExpiry,
      isVerified: false,
    });

    // generate JWT
    const token = signToken({
      userId: user._id,
      email: user.email,
    });

    // create response
    const response = NextResponse.json({
      message: "Account created successfully. Verify your email.",
      user: {
        id: user._id,
        email: user.email,
      },
    });

    // store token in cookie
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

     // Try to send OTP email (don't fail if email fails)
     try {
       const emailResult = await sendEmailOTP(user.email, otp);
       if (!emailResult.success) {
         console.error("Email sending failed: check mailer logs for details");
       }
     } catch (emailError) {
       console.error("Email sending failed:", emailError);
     }

    return response;
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}