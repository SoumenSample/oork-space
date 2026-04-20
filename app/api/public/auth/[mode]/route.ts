import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import dbConnect from "@/lib/dbConnect";
import { signToken } from "@/lib/jwt";
import { sendEmailOTP } from "@/lib/mailer";
import Database from "@/lib/models/Database";
import GalleryItem from "@/lib/models/GalleryItem";
import DatabaseProperty from "@/lib/models/DatabaseProperty";
import NocodeApp from "@/lib/models/NocodeApp";
import NocodePage from "@/lib/models/NocodePage";

// Deprecated (commented out by request): ProjectUser-based public auth flow.
// import ProjectUser from "@/lib/models/ProjectUser";

const PROJECT_AUTH_COOKIE_NAME = "project_auth_token";
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

type AuthMode = "signup" | "login" | "verify-otp";

const RATE_LIMIT_MAX: Record<AuthMode, number> = {
  signup: 6,
  login: 20,
  "verify-otp": 12,
};

type RateBucket = {
  count: number;
  resetAt: number;
};

type PublicAuthContext = {
  appId: string;
  pageSlug: string;
  requiresOtp: boolean;
  appOwnerId: string;
  appProjectId: string;
  requestedDatabaseId: string;
  targetDatabaseSource: "requested" | "default" | "fallback" | "none";
  targetDatabaseId: string;
};

type TableAuthValues = Record<string, unknown>;

const rateLimitStore = (() => {
  const globalWithStore = globalThis as typeof globalThis & {
    __publicAuthRateLimitStore?: Map<string, RateBucket>;
  };

  if (!globalWithStore.__publicAuthRateLimitStore) {
    globalWithStore.__publicAuthRateLimitStore = new Map<string, RateBucket>();
  }

  return globalWithStore.__publicAuthRateLimitStore;
})();

function asTrimmedString(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

function normalizeLookupKey(value: unknown): string {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function getClientIp(req: NextRequest): string {
  const xForwardedFor = asTrimmedString(req.headers.get("x-forwarded-for"));
  if (xForwardedFor) {
    const first = xForwardedFor.split(",")[0];
    return asTrimmedString(first) || "unknown-ip";
  }

  const xRealIp = asTrimmedString(req.headers.get("x-real-ip"));
  if (xRealIp) return xRealIp;

  return "unknown-ip";
}

function normalizeMode(raw: string): AuthMode | null {
  const mode = asTrimmedString(raw).toLowerCase();
  if (mode === "signup" || mode === "login" || mode === "verify-otp") {
    return mode;
  }
  return null;
}

function consumeRateLimit(key: string, maxAttempts: number): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();

  if (rateLimitStore.size > 2000) {
    for (const [storeKey, bucket] of rateLimitStore.entries()) {
      if (bucket.resetAt <= now) {
        rateLimitStore.delete(storeKey);
      }
    }
  }

  const current = rateLimitStore.get(key);
  if (!current || current.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, retryAfterSec: 0 };
  }

  if (current.count >= maxAttempts) {
    const retryAfterSec = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    return { allowed: false, retryAfterSec };
  }

  current.count += 1;
  rateLimitStore.set(key, current);
  return { allowed: true, retryAfterSec: 0 };
}

function buildRateLimitKey(req: NextRequest, mode: AuthMode, body: Record<string, unknown>): string {
  const ip = getClientIp(req);
  const slug = asTrimmedString(body.pageSlug ?? body.slug).toLowerCase();
  const email = asTrimmedString(body.email).toLowerCase();
  const databaseId = asTrimmedString(body.databaseId).toLowerCase();
  const identityPart = email || ip;
  return ["public-auth", mode, slug || "no-slug", databaseId || "no-db", identityPart].join(":");
}

function getItemValues(item: any): TableAuthValues {
  if (!item?.values || typeof item.values !== "object") return {};
  return item.values as TableAuthValues;
}

function getAuthPasswordHash(values: TableAuthValues): string {
  return asTrimmedString(values.__auth_passwordHash);
}

function getAuthOtpHash(values: TableAuthValues): string {
  return asTrimmedString(values.__auth_otpHash);
}

function getAuthOtpExpiry(values: TableAuthValues): Date | null {
  const raw = values.__auth_otpExpiry;
  if (!raw) return null;
  const date = new Date(String(raw));
  return Number.isNaN(date.getTime()) ? null : date;
}

function getAuthIsVerified(values: TableAuthValues): boolean {
  if (typeof values.__auth_isVerified === "boolean") {
    return values.__auth_isVerified;
  }
  if (typeof values.isVerified === "boolean") {
    return values.isVerified;
  }
  return false;
}

function setProjectAuthCookie(
  response: NextResponse,
  payload: { tableUserId: string; appId: string; databaseId: string }
) {
  const token = signToken({
    scope: "project-table-user",
    tableUserId: payload.tableUserId,
    appId: payload.appId,
    databaseId: payload.databaseId,
  });

  response.cookies.set(PROJECT_AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 7,
    path: "/p",
  });
}

async function resolvePublicAuthContext(
  req: NextRequest,
  body: Record<string, unknown>
): Promise<PublicAuthContext | null> {
  const reqUrl = new URL(req.url);
  const slugFromQuery = asTrimmedString(reqUrl.searchParams.get("slug"));
  const slugFromBody = asTrimmedString(body.pageSlug ?? body.slug);
  const candidateSlug = slugFromQuery || slugFromBody;

  if (!candidateSlug) {
    return null;
  }

  const page = await NocodePage.findOne({ slug: candidateSlug, status: "published" })
    .select("slug appId published.html")
    .lean<{ slug: string; appId: unknown; published?: { html?: unknown } }>();

  if (!page?.appId) {
    return null;
  }

  const publishedHtml = String(page?.published?.html || "");
  const hasVerifyOtpForm = /data-auth-form\s*=\s*["']verify-otp["']/i.test(publishedHtml);
  const hasOtpInput = /<input[^>]*name\s*=\s*["'](otp|code)["'][^>]*>/i.test(publishedHtml);
  const requiresOtp = hasVerifyOtpForm || hasOtpInput;

  const app = await NocodeApp.findById(page.appId)
    .select("userId projectId defaultDatabaseId")
    .lean<{ userId?: unknown; projectId?: unknown; defaultDatabaseId?: unknown }>();

  const appOwnerId = String(app?.userId || "");
  const appProjectId = String(app?.projectId || "");
  const requestedDatabaseId = asTrimmedString(body.databaseId);

  let targetDatabaseId = "";
  let targetDatabaseSource: PublicAuthContext["targetDatabaseSource"] = "none";
  if (requestedDatabaseId) {
    const requestedQuery: Record<string, unknown> = { _id: requestedDatabaseId };
    if (appProjectId) {
      requestedQuery.projectId = appProjectId;
    }
    if (appOwnerId) {
      requestedQuery.ownerId = appOwnerId;
    }

    const requested = await Database.findOne(requestedQuery)
      .select("_id")
      .lean<{ _id?: unknown }>();

    if (requested?._id) {
      targetDatabaseId = String(requested._id);
      targetDatabaseSource = "requested";
    }
  }

  if (!targetDatabaseId) {
    targetDatabaseId = String(app?.defaultDatabaseId || "");
    if (targetDatabaseId) {
      targetDatabaseSource = "default";
    }
  }

  if (!targetDatabaseId && appProjectId) {
    const fallback = await Database.findOne({
      projectId: appProjectId,
      ownerId: appOwnerId || undefined,
    })
      .select("_id")
      .sort({ updatedAt: -1 });

    targetDatabaseId = String(fallback?._id || "");
    if (targetDatabaseId) {
      targetDatabaseSource = "fallback";
    }
  }

  return {
    appId: String(page.appId),
    pageSlug: String(page.slug),
    requiresOtp,
    appOwnerId,
    appProjectId,
    requestedDatabaseId,
    targetDatabaseSource,
    targetDatabaseId,
  };
}

function buildTableMeta(authContext: PublicAuthContext) {
  return {
    databaseId: authContext.targetDatabaseId || null,
    source: authContext.targetDatabaseSource,
    requestedDatabaseId: authContext.requestedDatabaseId || null,
  };
}

async function getPropertyLookupMap(databaseId: string): Promise<Map<string, string>> {
  const properties = await DatabaseProperty.find({ databaseId: String(databaseId) })
    .select("_id name")
    .lean<Array<{ _id: unknown; name?: unknown }>>();

  const propertyIdByLookup = new Map<string, string>();
  properties.forEach((property) => {
    const key = normalizeLookupKey(property?.name);
    const id = String(property?._id || "");
    if (key && id && !propertyIdByLookup.has(key)) {
      propertyIdByLookup.set(key, id);
    }
  });

  return propertyIdByLookup;
}

function applyPropertyAliases(values: TableAuthValues, propertyIdByLookup: Map<string, string>) {
  Object.entries({ ...values }).forEach(([key, value]) => {
    const propertyId = propertyIdByLookup.get(normalizeLookupKey(key));
    if (propertyId && values[propertyId] === undefined) {
      values[propertyId] = value;
    }
  });
}

async function findAuthTableUserByEmail(authContext: PublicAuthContext, email: string) {
  if (!authContext.targetDatabaseId) {
    return null;
  }

  const propertyIdByLookup = await getPropertyLookupMap(authContext.targetDatabaseId);
  const emailPropertyId = propertyIdByLookup.get("email");

  const query: Record<string, unknown> = {
    databaseId: authContext.targetDatabaseId,
    $or: [
      { "values.email": email },
      ...(emailPropertyId ? [{ [`values.${emailPropertyId}`]: email }] : []),
    ],
  };

  return GalleryItem.findOne(query).sort({ createdAt: -1 });
}

async function createAuthTableUser(
  authContext: PublicAuthContext,
  args: {
    name: string;
    email: string;
    passwordHash: string;
    requiresOtp: boolean;
    otpHash: string | null;
    otpExpiry: Date | null;
  }
) {
  const propertyIdByLookup = await getPropertyLookupMap(authContext.targetDatabaseId);

  const values: TableAuthValues = {
    name: args.name,
    email: args.email,
    password: args.passwordHash,
    isVerified: !args.requiresOtp,
    sourcePageSlug: authContext.pageSlug,
    signupSource: "public-auth",
    __auth_passwordHash: args.passwordHash,
    __auth_isVerified: !args.requiresOtp,
    __auth_lastLoginAt: null,
  };

  if (args.otpHash) {
    values.__auth_otpHash = args.otpHash;
    values.__auth_otpExpiry = args.otpExpiry ? args.otpExpiry.toISOString() : null;
  } else {
    values.__auth_otpHash = null;
    values.__auth_otpExpiry = null;
  }

  applyPropertyAliases(values, propertyIdByLookup);

  const created = await GalleryItem.create({
    databaseId: authContext.targetDatabaseId,
    title: args.name || args.email || "User",
    values,
  });

  const createdAtDate = created?.createdAt ? new Date(created.createdAt) : new Date();
  const createdAtIso = Number.isNaN(createdAtDate.getTime())
    ? new Date().toISOString()
    : createdAtDate.toISOString();
  const createdAtDateOnly = createdAtIso.slice(0, 10);

  const systemValues: Record<string, unknown> = {
    id: String(created._id),
    dateCreated: createdAtDateOnly,
  };

  const valuesPatch: Record<string, unknown> = {};
  Object.entries(systemValues).forEach(([key, value]) => {
    valuesPatch[`values.${key}`] = value;
    const propertyId = propertyIdByLookup.get(normalizeLookupKey(key));
    if (propertyId) {
      valuesPatch[`values.${propertyId}`] = value;
    }
  });

  if (Object.keys(valuesPatch).length) {
    await GalleryItem.updateOne({ _id: created._id }, { $set: valuesPatch });
  }

  return created;
}

async function handleSignup(body: Record<string, unknown>, authContext: PublicAuthContext) {
  const name = asTrimmedString(body.name);
  const email = asTrimmedString(body.email).toLowerCase();
  const password = asTrimmedString(body.password);

  if (!name || !email || !password) {
    return NextResponse.json(
      { success: false, message: "Name, email, and password are required" },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { success: false, message: "Password must be at least 6 characters" },
      { status: 400 }
    );
  }

  if (!authContext.targetDatabaseId) {
    return NextResponse.json(
      {
        success: false,
        message: "No table found for this app. Create/select a project table first.",
        table: buildTableMeta(authContext),
      },
      { status: 400 }
    );
  }

  const existingUser = await findAuthTableUserByEmail(authContext, email);
  if (existingUser) {
    return NextResponse.json(
      { success: false, message: "Account already exists for this project" },
      { status: 409 }
    );
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const requiresOtp = Boolean(authContext.requiresOtp);
  const otp = requiresOtp
    ? Math.floor(100000 + Math.random() * 900000).toString()
    : null;
  const otpHash = otp ? await bcrypt.hash(otp, 10) : null;
  const otpExpiry = otp ? new Date(Date.now() + 10 * 60 * 1000) : null;

  const tableUser = await createAuthTableUser(authContext, {
    name,
    email,
    passwordHash: hashedPassword,
    requiresOtp,
    otpHash,
    otpExpiry,
  });

  if (otp) {
    try {
      const emailResult = await sendEmailOTP(email, otp);
      if (!emailResult.success) {
        console.error("Project OTP email failed for", email);
      }
    } catch (emailError) {
      console.error("Project OTP email failed:", emailError);
    }
  }

  return NextResponse.json({
    success: true,
    message: requiresOtp
      ? "Account created for this project. Verify your email."
      : "Account created for this project.",
    projectUser: {
      id: String(tableUser._id),
      name,
      email,
    },
    table: {
      ...buildTableMeta(authContext),
      synced: true,
      itemId: String(tableUser._id),
    },
  });
}

async function handleLogin(body: Record<string, unknown>, authContext: PublicAuthContext) {
  const email = asTrimmedString(body.email).toLowerCase();
  const password = asTrimmedString(body.password);

  if (!email || !password) {
    return NextResponse.json(
      { success: false, message: "Email and password are required" },
      { status: 400 }
    );
  }

  if (!authContext.targetDatabaseId) {
    return NextResponse.json(
      {
        success: false,
        message: "No table found for this app. Create/select a project table first.",
        table: buildTableMeta(authContext),
      },
      { status: 400 }
    );
  }

  const tableUser = await findAuthTableUserByEmail(authContext, email);
  if (!tableUser) {
    return NextResponse.json(
      { success: false, message: "Invalid credentials" },
      { status: 401 }
    );
  }

  const values = getItemValues(tableUser);
  const passwordHash = getAuthPasswordHash(values);
  if (!passwordHash) {
    return NextResponse.json(
      { success: false, message: "Invalid credentials" },
      { status: 401 }
    );
  }

  const isMatch = await bcrypt.compare(password, passwordHash);
  if (!isMatch) {
    return NextResponse.json(
      { success: false, message: "Invalid credentials" },
      { status: 401 }
    );
  }

  const isVerified = getAuthIsVerified(values);
  if (!isVerified) {
    return NextResponse.json(
      { success: false, message: "Please verify your email first" },
      { status: 403 }
    );
  }

  const nowIso = new Date().toISOString();
  await GalleryItem.updateOne(
    { _id: tableUser._id },
    {
      $set: {
        "values.__auth_lastLoginAt": nowIso,
        "values.lastLoginAt": nowIso,
      },
    }
  );

  const response = NextResponse.json({
    success: true,
    message: "Project login successful",
    projectUser: {
      id: String(tableUser._id),
      name: asTrimmedString(values.name),
      email,
    },
    table: buildTableMeta(authContext),
  });

  setProjectAuthCookie(response, {
    tableUserId: String(tableUser._id),
    appId: authContext.appId,
    databaseId: authContext.targetDatabaseId,
  });

  return response;
}

async function handleVerifyOtp(body: Record<string, unknown>, authContext: PublicAuthContext) {
  const email = asTrimmedString(body.email).toLowerCase();
  const otp = asTrimmedString(body.otp);

  if (!email || !otp) {
    return NextResponse.json(
      { success: false, message: "Email and OTP are required" },
      { status: 400 }
    );
  }

  if (!authContext.targetDatabaseId) {
    return NextResponse.json(
      {
        success: false,
        message: "No table found for this app. Create/select a project table first.",
        table: buildTableMeta(authContext),
      },
      { status: 400 }
    );
  }

  const tableUser = await findAuthTableUserByEmail(authContext, email);
  if (!tableUser) {
    return NextResponse.json(
      { success: false, message: "User not found for this project" },
      { status: 404 }
    );
  }

  const values = getItemValues(tableUser);
  const isVerified = getAuthIsVerified(values);
  if (isVerified) {
    return NextResponse.json({
      success: true,
      message: "Email already verified",
      projectUser: {
        id: String(tableUser._id),
        name: asTrimmedString(values.name),
        email,
      },
      table: buildTableMeta(authContext),
    });
  }

  const otpHash = getAuthOtpHash(values);
  if (!otpHash) {
    return NextResponse.json(
      { success: false, message: "Invalid OTP" },
      { status: 400 }
    );
  }

  const otpMatches = await bcrypt.compare(otp, otpHash);
  if (!otpMatches) {
    return NextResponse.json(
      { success: false, message: "Invalid OTP" },
      { status: 400 }
    );
  }

  const otpExpiry = getAuthOtpExpiry(values);
  if (!otpExpiry || otpExpiry < new Date()) {
    return NextResponse.json(
      { success: false, message: "OTP expired" },
      { status: 400 }
    );
  }

  const nowIso = new Date().toISOString();
  await GalleryItem.updateOne(
    { _id: tableUser._id },
    {
      $set: {
        "values.__auth_isVerified": true,
        "values.isVerified": true,
        "values.__auth_otpHash": null,
        "values.__auth_otpExpiry": null,
        "values.__auth_lastLoginAt": nowIso,
        "values.lastLoginAt": nowIso,
      },
    }
  );

  const response = NextResponse.json({
    success: true,
    message: "OTP verified. Project account ready.",
    projectUser: {
      id: String(tableUser._id),
      name: asTrimmedString(values.name),
      email,
    },
    table: buildTableMeta(authContext),
  });

  setProjectAuthCookie(response, {
    tableUserId: String(tableUser._id),
    appId: authContext.appId,
    databaseId: authContext.targetDatabaseId,
  });

  return response;
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ mode: string }> }
) {
  try {
    await dbConnect();

    const { mode: rawMode } = await context.params;
    const mode = normalizeMode(rawMode);
    if (!mode) {
      return NextResponse.json({ success: false, message: "Unsupported auth mode" }, { status: 404 });
    }

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

    const limitKey = buildRateLimitKey(req, mode, body);
    const limitResult = consumeRateLimit(limitKey, RATE_LIMIT_MAX[mode]);
    if (!limitResult.allowed) {
      return NextResponse.json(
        { success: false, message: "Too many attempts. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(limitResult.retryAfterSec),
          },
        }
      );
    }

    const authContext = await resolvePublicAuthContext(req, body);

    if (!authContext) {
      return NextResponse.json(
        { success: false, message: "Unable to resolve published project context" },
        { status: 400 }
      );
    }

    if (mode === "signup") {
      return await handleSignup(body, authContext);
    }

    if (mode === "login") {
      return await handleLogin(body, authContext);
    }

    return await handleVerifyOtp(body, authContext);
  } catch (error) {
    console.error("PUBLIC AUTH ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
