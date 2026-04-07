import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";

export interface AuthUser {
  userId: string;
  email?: string;
}

interface TokenPayload {
  userId?: string;
  email?: string;
}

export async function getAuthUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return null;
    }

    const decoded = verifyToken(token) as TokenPayload;
    if (!decoded?.userId) {
      return null;
    }

    return {
      userId: String(decoded.userId),
      email: decoded.email,
    };
  } catch {
    return null;
  }
}
