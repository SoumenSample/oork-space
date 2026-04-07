import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import User from "@/lib/models/User";
import dbConnect from "@/lib/dbConnect";
import { signToken } from "@/lib/jwt";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL?.trim();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

export async function POST(req: Request) {
  try {
    await dbConnect();

    const { email, password } = await req.json();

    // validation
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password required" },
        { status: 400 }
      );
    }

    // Optional admin override via environment variables only
    if (
      ADMIN_EMAIL &&
      ADMIN_PASSWORD &&
      email.toLowerCase() === ADMIN_EMAIL.toLowerCase() &&
      password === ADMIN_PASSWORD
    ) {
      // Find or create admin user
      let user = await User.findOne({ email: ADMIN_EMAIL });
      
      if (!user) {
        // Create admin user
        const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);
        user = await User.create({
          name: "Admin",
          email: ADMIN_EMAIL,
          password: hashedPassword,
          isVerified: true,
        });
      } else {
        // Update admin user to have verified status
        if (!user.isVerified) {
          user.isVerified = true;
          await user.save();
        }
      }
      
      // Generate JWT
      const token = signToken({
        userId: user._id,
        email: user.email,
      });
      
      const response = NextResponse.json({
        message: "Login successful",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
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

    // Normal login flow for other users
    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Check if OAuth user trying to login with password
    if (user.isOAuth && !user.password) {
      return NextResponse.json(
        { success: false, message: "This account was created with Google. Please sign in with Google." },
        { status: 401 }
      );
    }

    // check password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // check email verification (skip for OAuth users)
    if (!user.isVerified && !user.isOAuth) {
      return NextResponse.json(
        {
          success: false,
          message: "Please verify your email first",
        },
        { status: 403 }
      );
    }

    const token = signToken({
      userId: user._id,
      email: user.email,
    });
    
    const response = NextResponse.json({
      message: "Login successful",
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
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
