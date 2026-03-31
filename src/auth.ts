import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { recordSecurityEvent } from "@/lib/audit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { RoleCode, UserSession } from "@/lib/types";

const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_BOOTSTRAP_ROLE: RoleCode = "SALES";

type SessionResult = {
  user: UserSession;
};

type AuthMetadata = Record<string, unknown> | null | undefined;

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

export async function auth() {
  return resolveSupabaseSession();
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
  const signInResult = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password: options.password,
  });

  if (signInResult.error || !signInResult.data.user) {
    registerFailedAttempt(rateLimitKey);
    await recordSecurityEvent({
      action: "auth.login.failed",
      success: false,
      detail: "Login failed.",
      metadata: { emailLength: normalizedEmail.length },
    });
    redirect("/login?error=invalid");
  }

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

export async function signOut(options?: { redirectTo?: string }) {
  const session = await auth();

  try {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  } catch {
    // Best-effort sign-out.
  }

  await recordSecurityEvent({
    actorId: session?.user?.id,
    action: "auth.logout",
    success: true,
    detail: "Session terminated.",
  });

  redirect(options?.redirectTo || "/login");
}
