import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const LOCKOUT_MS = 15 * 60 * 1000;

interface AttemptRecord {
  count: number;
  windowStart: number;
  lockedUntil?: number;
}

const attempts = new Map<string, AttemptRecord>();

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function checkRateLimit(ip: string): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const record = attempts.get(ip);

  if (!record) {
    return { allowed: true };
  }

  if (record.lockedUntil && now < record.lockedUntil) {
    return { allowed: false, retryAfterMs: record.lockedUntil - now };
  }

  if (now - record.windowStart > WINDOW_MS) {
    attempts.delete(ip);
    return { allowed: true };
  }

  if (record.count >= MAX_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_MS;
    return { allowed: false, retryAfterMs: LOCKOUT_MS };
  }

  return { allowed: true };
}

function recordAttempt(ip: string) {
  const now = Date.now();
  const record = attempts.get(ip);

  if (!record || now - record.windowStart > WINDOW_MS) {
    attempts.set(ip, { count: 1, windowStart: now });
  } else {
    record.count++;
  }
}

function clearAttempts(ip: string) {
  attempts.delete(ip);
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rateCheck = checkRateLimit(ip);

  if (!rateCheck.allowed) {
    return NextResponse.json(
      { success: false, error: "Too many attempts. Try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": Math.ceil((rateCheck.retryAfterMs || 0) / 1000).toString(),
        },
      }
    );
  }

  const { password } = await request.json();

  if (password === process.env.ADMIN_PASSWORD) {
    clearAttempts(ip);

    const response = NextResponse.json({ success: true });

    // Set secure=false for HTTP access (set SECURE_COOKIES=true for HTTPS)
    response.cookies.set("mc_auth", process.env.AUTH_SECRET || "steelcity-secret", {
      httpOnly: true,
      secure: process.env.SECURE_COOKIES === "true",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  }

  recordAttempt(ip);

  return NextResponse.json(
    { success: false, error: "Invalid password" },
    { status: 401 }
  );
}
