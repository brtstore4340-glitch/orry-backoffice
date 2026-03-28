import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { headers, cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getPrisma } from "@/lib/db";
import { demoSession } from "@/lib/demo-data";
import { getRuntimeEnv, isProduction } from "@/lib/env";
import { verifyPassword } from "@/lib/security";
import { recordSecurityEvent } from "@/lib/audit";
import type { UserSession } from "@/lib/types";

const SESSION_COOKIE = isProduction() ? "__Host-orry-session" : "orry-session";
const SESSION_TTL_SECONDS = 60 * 60 * 12;
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

type SessionPayload = {
  exp: number;
  iat: number;
  user: UserSession;
};

declare global {
  var orryLoginRateLimit: Map<string, { count: number; expiresAt: number }> | undefined;
}

function getSessionSecret() {
  const env = getRuntimeEnv();
  if (!env.AUTH_SECRET) {
    throw new Error("AUTH_SECRET is required.");
  }
  return env.AUTH_SECRET;
}

function getRateLimitStore() {
  if (!global.orryLoginRateLimit) {
    global.orryLoginRateLimit = new Map();
  }
  return global.orryLoginRateLimit;
}

async function getRequestFingerprint(email: string) {
  const requestHeaders = await headers();
  const forwardedFor = requestHeaders.get("x-forwarded-for") ?? "";
  const ipAddress = forwardedFor.split(",")[0]?.trim() || requestHeaders.get("x-real-ip") || "unknown";
  return `${email.trim().toLowerCase()}::${ipAddress}`;
}

async function assertLoginRateLimit(email: string) {
  const key = await getRequestFingerprint(email);
  const now = Date.now();
  const store = getRateLimitStore();
  const existing = store.get(key);

  if (existing && existing.expiresAt > now && existing.count >= MAX_LOGIN_ATTEMPTS) {
    throw new Error("RATE_LIMITED");
  }

  if (!existing || existing.expiresAt <= now) {
    store.set(key, { count: 0, expiresAt: now + LOGIN_WINDOW_MS });
  }

  return key;
}

function registerFailedAttempt(key: string) {
  const now = Date.now();
  const store = getRateLimitStore();
  const existing = store.get(key);

  if (!existing || existing.expiresAt <= now) {
    store.set(key, { count: 1, expiresAt: now + LOGIN_WINDOW_MS });
    return;
  }

  store.set(key, { count: existing.count + 1, expiresAt: existing.expiresAt });
}

function clearFailedAttempts(key: string) {
  getRateLimitStore().delete(key);
}

function encodeBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signPayload(payload: string) {
  return createHmac("sha256", getSessionSecret()).update(payload).digest("base64url");
}

function createSessionToken(user: UserSession) {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    exp: now + SESSION_TTL_SECONDS,
    iat: now,
    user
  };
  const encoded = encodeBase64Url(JSON.stringify(payload));
  return `${encoded}.${signPayload(encoded)}`;
}

function readSessionToken(token: string | undefined): SessionPayload | null {
  if (!token) {
    return null;
  }

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = signPayload(encodedPayload);
  const actual = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);

  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return null;
  }

  try {
    const parsed = JSON.parse(decodeBase64Url(encodedPayload)) as SessionPayload;
    if (!parsed.exp || parsed.exp < Math.floor(Date.now() / 1000) || !parsed.user) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

async function resolveUser(email: string, password: string): Promise<UserSession | null> {
  const normalizedEmail = email.trim().toLowerCase();
  const prisma = getPrisma();

  if (!prisma) {
    if (!isProduction() && normalizedEmail === demoSession.email && password === "demo-admin") {
      return demoSession;
    }
    return null;
  }

  const user = await prisma.user.findUnique({ include: { role: true }, where: { email: normalizedEmail } });
  if (!user || !user.active || !verifyPassword(password, user.passwordHash)) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role.code
  };
}

async function hydrateActiveSession(payload: SessionPayload | null) {
  if (!payload) {
    return null;
  }

  if (payload.user.id === demoSession.id) {
    return isProduction() ? null : { user: demoSession };
  }

  const prisma = getPrisma();
  if (!prisma) {
    return null;
  }

  const user = await prisma.user.findUnique({ include: { role: true }, where: { id: payload.user.id } });
  if (!user || !user.active) {
    return null;
  }

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.code
    }
  };
}

export async function auth() {
  const cookieStore = await cookies();
  const payload = readSessionToken(cookieStore.get(SESSION_COOKIE)?.value);
  return hydrateActiveSession(payload);
}

export async function signIn(
  _provider: "credentials",
  options: { email: string; password: string; redirectTo?: string }
) {
  const normalizedEmail = options.email.trim().toLowerCase();
  let rateLimitKey = "";

  try {
    rateLimitKey = await assertLoginRateLimit(normalizedEmail);
  } catch {
    await recordSecurityEvent({
      action: "auth.login.rate_limited",
      success: false,
      detail: "Login request blocked by rate limiter.",
      metadata: { emailLength: normalizedEmail.length }
    });
    redirect("/login?error=invalid");
  }

  const user = await resolveUser(normalizedEmail, options.password);
  if (!user) {
    registerFailedAttempt(rateLimitKey);
    await recordSecurityEvent({
      action: "auth.login.failed",
      success: false,
      detail: "Login failed.",
      metadata: { emailLength: normalizedEmail.length }
    });
    redirect("/login?error=invalid");
  }

  clearFailedAttempts(rateLimitKey);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, createSessionToken(user), {
    httpOnly: true,
    sameSite: "strict",
    secure: isProduction(),
    path: "/",
    maxAge: SESSION_TTL_SECONDS
  });

  await recordSecurityEvent({
    actorId: user.id,
    action: "auth.login.success",
    success: true,
    detail: "Login succeeded."
  });

  redirect(options.redirectTo || "/dashboard");
}

export async function signOut(options?: { redirectTo?: string }) {
  const session = await auth();
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);

  await recordSecurityEvent({
    actorId: session?.user?.id,
    action: "auth.logout",
    success: true,
    detail: "Session terminated."
  });

  redirect(options?.redirectTo || "/login");
}
