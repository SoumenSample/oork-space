import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Webhook test endpoint is live",
    endpoint: "/api/webhook-test",
    methods: ["GET", "POST"],
  });
}

export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") || "";

  let body: unknown = null;
  if (contentType.includes("application/json")) {
    try {
      body = await req.json();
    } catch {
      body = { error: "Invalid JSON body" };
    }
  } else {
    try {
      body = await req.text();
    } catch {
      body = null;
    }
  }

  return NextResponse.json({
    success: true,
    message: "Webhook received",
    timestamp: new Date().toISOString(),
    body,
  });
}
