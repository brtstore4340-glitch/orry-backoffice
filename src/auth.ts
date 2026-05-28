import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { recordSecurityEvent } from "@/lib/audit";
import { getPrisma } from "@/lib/db";
import { verifyPassword } from "@/lib/security";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { RoleCode, UserSession } from "@/lib/types";

const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_BOOTSTRAP_ROLE: RoleCode = "SALES";
const LOCAL_SESSION_COOKIE = "orry_local_session";
const LOCAL_SESSION_TTL_MS = 12 * 60 * 60 * 1000;

type SessionResult = {
  user: UserSession;
};

type AuthMetadata = Record<string, unknown> | null | undefined;
type LocalSessionPayload = UserSession & { exp: number };

declare global {
  var orryLoginRateLimit: Map<string, { count: number; expiresAt: number }> | undefined;
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

function getLocalSessionSecret() {
  return process.env.AUTH_SECRET || "orry-local-auth-secret";
}

function encodeLocalSession(payload: LocalSessionPayload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", getLocalSessionSecret()).update(body).digest("base64url");
  return `${body}.${signature}`;
}

function decodeLocalSession(token: string | undefined) {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const expected = createHmac("sha256", getLocalSessionSecret()).update(body).digest();
  const received = Buffer.from(signature, "base64url");
  if (expected.byteLength !== received.byteLength || !timingSafeEqual(expected, received)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as LocalSessionPayload;
    if (!payload?.id || !payload?.email || !payload?.role || payload.exp <= Date.now()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

async function setLocalSessionCookie(user: UserSession) {
  const store = await cookies();
  store.set(LOCAL_SESSION_COOKIE, encodeLocalSession({ ...user, exp: Date.now() + LOCAL_SESSION_TTL_MS }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(Date.now() + LOCAL_SESSION_TTL_MS),
  });
}

async function clearLocalSessionCookie() {
  const store = await cookies();
  store.set(LOCAL_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function resolveDisplayName(userMetadata: AuthMetadata, email: string) {
  const directName = readString(userMetadata?.name);
  if (directName) {
    return directName;
  }

  const firstName = readString(userMetadata?.first_name);
  const lastName = readString(userMetadata?.last_name);
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
  if (fullName) {
    return fullName;
  }

  const emailPrefix = email.split("@")[0]?.trim();
  return emailPrefix || "ORRY operator";
}

function isEligibleForAccess(appMetadata: AuthMetadata) {
  return appMetadata?.active !== false && appMetadata?.approval_status !== "PENDING" && appMetadata?.approval_status !== "REJECTED";
}

function resolveRoleCode(value: unknown): RoleCode {
  switch (value) {
    case "ADMIN":
    case "SALES":
    case "FINANCE":
    case "OPERATIONS":
    case "EXECUTIVE":
      return value;
    default:
      return DEFAULT_BOOTSTRAP_ROLE;
  }
}

function resolveActorId(authUser: { id: string; app_metadata?: AuthMetadata }) {
  return readString(authUser.app_metadata?.app_user_id) ?? authUser.id;
}

function toSession(authUser: { id: string; email?: string | null; app_metadata?: AuthMetadata; user_metadata?: AuthMetadata }, role: RoleCode): SessionResult {
  const email = authUser.email?.trim().toLowerCase() || "";
  return {
    user: {
      id: resolveActorId(authUser),
      name: resolveDisplayName(authUser.user_metadata, email),
      email,
      role,
    },
  };
}

function toLocalSession(user: { id: string; email: string; name: string; role?: { code?: RoleCode | null } | null }): SessionResult {
  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email.trim().toLowerCase(),
      role: resolveRoleCode(user.role?.code),
    },
  };
}

async function resolveSupabaseSession() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return null;
    }

    if (!isEligibleForAccess(authUser.app_metadata)) {
      await supabase.auth.signOut();
      return null;
    }

    return toSession(authUser, resolveRoleCode(authUser.app_metadata?.role));
  } catch {
    return null;
  }
}

async function resolveLocalSession() {
  try {
    const store = await cookies();
    const payload = decodeLocalSession(store.get(LOCAL_SESSION_COOKIE)?.value);
    if (!payload) {
      return null;
    }

    return {
      user: {
        id: payload.id,
        name: payload.name,
        email: payload.email,
        role: payload.role,
      },
    };
  } catch {
    return null;
  }
}

async function authenticateWithLocalUser(email: string, password: string) {
  const prisma = getPrisma() as any;
  if (!prisma) return null;

  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: true },
  });

  if (!user?.passwordHash || !verifyPassword(password, user.passwordHash)) {
    return null;
  }

  if (!user.active || user.approvalStatus !== "APPROVED") {
    return { status: "ineligible" as const, session: null, actorId: user.id };
  }

  return { status: "ok" as const, session: toLocalSession(user), actorId: user.id };
}

export async function auth() {
  const supabaseSession = await resolveSupabaseSession();
  if (supabaseSession) {
    return supabaseSession;
  }

  return resolveLocalSession();
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
      metadata: { emailLength: normalizedEmail.length },
    });
    redirect("/login?error=invalid");
  }

  const supabase = await createSupabaseServerClient();
  let signInResult:
    | Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>
    | null = null;

  try {
    signInResult = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: options.password,
    });
  } catch {
    signInResult = null;
  }

  if (signInResult?.data?.user && !signInResult.error) {
    if (!isEligibleForAccess(signInResult.data.user.app_metadata)) {
      await supabase.auth.signOut();
      registerFailedAttempt(rateLimitKey);
      await recordSecurityEvent({
        actorId: resolveActorId(signInResult.data.user),
        action: "auth.login.failed",
        success: false,
        targetType: "User",
        targetId: resolveActorId(signInResult.data.user),
        detail: "Login denied because the account is not active and approved.",
      });
      redirect("/login?error=invalid");
    }

    await clearLocalSessionCookie();
    clearFailedAttempts(rateLimitKey);

    await recordSecurityEvent({
      actorId: resolveActorId(signInResult.data.user),
      action: "auth.login.success",
      success: true,
      targetType: "User",
      targetId: resolveActorId(signInResult.data.user),
      detail: "Login succeeded through Supabase Auth.",
    });

    redirect(options.redirectTo || "/dashboard");
  }

  const localAuth = await authenticateWithLocalUser(normalizedEmail, options.password);
  if (localAuth?.status === "ok" && localAuth.session) {
    await setLocalSessionCookie(localAuth.session.user);
    clearFailedAttempts(rateLimitKey);
    await recordSecurityEvent({
      actorId: localAuth.actorId,
      action: "auth.login.success",
      success: true,
      targetType: "User",
      targetId: localAuth.actorId,
      detail: "Login succeeded through local Prisma fallback.",
    });
    redirect(options.redirectTo || "/dashboard");
  }

  registerFailedAttempt(rateLimitKey);
  await recordSecurityEvent({
    actorId: localAuth?.actorId,
    action: "auth.login.failed",
    success: false,
    targetType: localAuth?.actorId ? "User" : undefined,
    targetId: localAuth?.actorId,
    detail: localAuth?.status === "ineligible" ? "Login denied because the account is not active and approved." : "Login failed.",
    metadata: {
      emailLength: normalizedEmail.length,
      supabaseError: signInResult?.error ? String(signInResult.error.message ?? signInResult.error.name ?? "unknown") : undefined,
    },
  });
  redirect("/login?error=invalid");
}

export async function signOut(options?: { redirectTo?: string }) {
  const session = await auth();

  try {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  } catch {
    // Best-effort sign-out.
  }

  await clearLocalSessionCookie();

  await recordSecurityEvent({
    actorId: session?.user?.id,
    action: "auth.logout",
    success: true,
    detail: "Session terminated.",
  });

  redirect(options?.redirectTo || "/login");
}
