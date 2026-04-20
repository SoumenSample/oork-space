import { NextResponse } from "next/server";

const PROJECT_AUTH_COOKIE_NAME = "project_auth_token";

export async function POST() {
  try {
    const response = NextResponse.json({
      success: true,
      message: "Project user logged out successfully",
    });

    response.cookies.set(PROJECT_AUTH_COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      expires: new Date(0),
      path: "/p",
    });

    return response;
  } catch {
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
