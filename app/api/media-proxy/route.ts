import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const requestUrl = new URL(req.url);
  const targetUrl = requestUrl.searchParams.get("u");

  if (!targetUrl) {
    return NextResponse.json({ error: "Missing media url" }, { status: 400 });
  }

  let upstream: Response;
  try {
    const headers = new Headers();
    const range = req.headers.get("range");
    if (range) {
      headers.set("range", range);
    }

    upstream = await fetch(targetUrl, {
      headers,
      redirect: "follow",
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch media" }, { status: 502 });
  }

  const responseHeaders = new Headers();
  const contentType = upstream.headers.get("content-type");
  const contentLength = upstream.headers.get("content-length");
  const contentRange = upstream.headers.get("content-range");

  if (contentType) responseHeaders.set("content-type", contentType);
  if (contentLength) responseHeaders.set("content-length", contentLength);
  if (contentRange) responseHeaders.set("content-range", contentRange);
  responseHeaders.set("accept-ranges", upstream.headers.get("accept-ranges") || "bytes");
  responseHeaders.set("cache-control", "no-store");

  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}