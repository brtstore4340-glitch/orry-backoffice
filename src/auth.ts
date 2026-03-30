import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getPrisma } from "@/lib/db";
import { getRuntimeEnv } from "@/lib/env";
import { verifyPassword } from "@/lib/security";
import { recordSecurityEvent } from "@/lib/audit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { RoleCode, UserSession } from "@/lib/types";

const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const BLOCKED_BAN_DURATION = "876000h";

type SessionResult = {
  user: UserSession;
};

type AppUserRecord = {
  id: string;
  authUserId: string | null;
  email: string;
  passwordHash: string | null;
  name: string;
  firstName: string;
  lastName: string;
  employeeId: string | null;
  dateOfBirth: Date | null;
  active: boolean;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  role: { code: RoleCode };
};

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

function isEligibleForAccess(user: Pick<AppUserRecord, "active" | "approvalStatus">) {
  return user.active && user.approvalStatus === "APPROVED";
}

function toSession(user: AppUserRecord): SessionResult {
  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.code,
    },
  };
}

async function findAppUser(where: { authUserId?: string; email?: string }) {
  const prisma = getPrisma();
  if (!prisma) {
    return null;
  }

  if (where.authUserId) {
    const direct = await prisma.user.findUnique({
      where: { authUserId: where.authUserId },
      include: { role: true },
    });

    if (direct) {
      return direct as AppUserRecord;
    }
  }

  if (!where.email) {
    return null;
  }

  const fallback = await prisma.user.findUnique({
    where: { email: where.email.toLowerCase() },
    include: { role: true },
  });

  if (!fallback) {
    return null;
  }

  if (!fallback.authUserId && where.authUserId) {
    const linked = await prisma.user.update({
      where: { id: fallback.id },
      data: { authUserId: where.authUserId },
      include: { role: true },
    });
    return linked as AppUserRecord;
  }

  return fallback as AppUserRecord;
}

function buildUserMetadata(user: AppUserRecord) {
  return {
    name: user.name,
    first_name: user.firstName,
    last_name: user.lastName,
    employee_id: user.employeeId ?? undefined,
    date_of_birth: user.dateOfBirth ? user.dateOfBirth.toISOString().slice(0, 10) : undefined,
  };
}

function buildAppMetadata(user: AppUserRecord) {
  return {
    app_user_id: user.id,
    role: user.role.code,
    approval_status: user.approvalStatus,
    active: user.active,
  };
}

async function syncSupabaseIdentity(user: AppUserRecord, password: string) {
  const prisma = getPrisma();
  if (!prisma) {
    throw new Error("DATABASE_UNAVAILABLE");
  }

  const admin = getSupabaseAdminClient();
  const authPayload = {
    email: user.email,
    password,
    email_confirm: true,
    user_metadata: buildUserMetadata(user),
    app_metadata: buildAppMetadata(user),
    ban_duration: isEligibleForAccess(user) ? "none" : BLOCKED_BAN_DURATION,
  };

  if (user.authUserId) {
    const { data, error } = await admin.auth.admin.updateUserById(user.authUserId, authPayload);
    if (error || !data.user) {
      throw error ?? new Error("SUPABASE_AUTH_UPDATE_FAILED");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: null },
    });

    return data.user.id;
  }

  const { data, error } = await admin.auth.admin.createUser(authPayload);
  if (error || !data.user) {
    throw error ?? new Error("SUPABASE_AUTH_CREATE_FAILED");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      authUserId: data.user.id,
      passwordHash: null,
    },
  });

  return data.user.id;
}

async function migrateLegacyUserOnLogin(email: string, password: string) {
  const prisma = getPrisma();
  if (!prisma) {
    return false;
  }

  const user = (await prisma.user.findUnique({
    where: { email },
    include: { role: true },
  })) as AppUserRecord | null;

  if (!user?.passwordHash || !verifyPassword(password, user.passwordHash)) {
    return false;
  }

  try {
    await syncSupabaseIdentity(user, password);
    return true;
  } catch {
    return false;
  }
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

    const appUser = await findAppUser({ authUserId: authUser.id, email: authUser.email ?? undefined });
    if (!appUser || !isEligibleForAccess(appUser)) {
      await supabase.auth.signOut();
      return null;
    }

    return toSession(appUser);
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
  let signInResult = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password: options.password,
  });

  if (signInResult.error || !signInResult.data.user) {
    const migrated = await migrateLegacyUserOnLogin(normalizedEmail, options.password);
    if (migrated) {
      signInResult = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: options.password,
      });
    }
  }

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

  const appUser = await findAppUser({
    authUserId: signInResult.data.user.id,
    email: signInResult.data.user.email ?? normalizedEmail,
  });

  if (!appUser || !isEligibleForAccess(appUser)) {
    await supabase.auth.signOut();
    registerFailedAttempt(rateLimitKey);
    await recordSecurityEvent({
      actorId: appUser?.id,
      action: "auth.login.failed",
      success: false,
      targetType: "User",
      targetId: appUser?.id,
      detail: "Login denied because the account is not active and approved.",
    });
    redirect("/login?error=invalid");
  }

  clearFailedAttempts(rateLimitKey);

  await recordSecurityEvent({
    actorId: appUser.id,
    action: "auth.login.success",
    success: true,
    targetType: "User",
    targetId: appUser.id,
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
