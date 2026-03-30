import "server-only";
import { randomInt } from "crypto";
import { headers } from "next/headers";
import { getPrisma } from "@/lib/db";
import { recordSecurityEvent } from "@/lib/audit";
import { EmailDeliveryError, sendPasswordResetEmail, sendTemporaryPasswordEmail } from "@/lib/email";
import { getRuntimeEnv } from "@/lib/env";
import { getPasswordPolicyHint, validatePasswordPolicy } from "@/lib/password-policy";
import { hashPassword } from "@/lib/security";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { RoleCode } from "@/lib/types";

const TEMP_PASSWORD_LENGTH = 8;
const LEGACY_RESET_SEED_LENGTH = 24;
const LOWERCASE = "abcdefghjkmnpqrstuvwxyz";
const UPPERCASE = "ABCDEFGHJKMNPQRSTUVWXYZ";
const MIXED_CASE = `${LOWERCASE}${UPPERCASE}`;
const MIXED_CASE_AND_DIGITS = `${LOWERCASE}${UPPERCASE}23456789`;
const DEFAULT_ROLE: RoleCode = "SALES";
const BLOCKED_BAN_DURATION = "876000h";

export type RegistrationInput = {
  email: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  dateOfBirth: string;
};

type StoredUser = {
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

function getAppBaseUrl(origin: string | null) {
  const env = getRuntimeEnv();
  return env.APP_BASE_URL ?? origin ?? "http://localhost:3000";
}

async function getOriginFromHeaders() {
  const requestHeaders = await headers();
  const forwardedProto = requestHeaders.get("x-forwarded-proto") ?? "http";
  const forwardedHost = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  return forwardedHost ? `${forwardedProto}://${forwardedHost}` : null;
}

function buildName(firstName: string, lastName: string) {
  return `${firstName.trim()} ${lastName.trim()}`.trim();
}

function normalizeInput(input: RegistrationInput) {
  const email = input.email.trim().toLowerCase();
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const employeeId = input.employeeId.trim().toUpperCase();
  const dateOfBirth = input.dateOfBirth.trim();

  if (!email || !firstName || !lastName || !employeeId || !dateOfBirth) {
    throw new Error("VALIDATION");
  }

  const parsedDate = new Date(`${dateOfBirth}T00:00:00.000Z`);
  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error("VALIDATION");
  }

  return { email, firstName, lastName, employeeId, dateOfBirth: parsedDate };
}

function generateMixedCasePassword(length: number) {
  const chars = [
    LOWERCASE[randomInt(0, LOWERCASE.length)],
    UPPERCASE[randomInt(0, UPPERCASE.length)],
  ];

  while (chars.length < length) {
    chars.push(MIXED_CASE[randomInt(0, MIXED_CASE.length)]);
  }

  for (let index = chars.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(0, index + 1);
    [chars[index], chars[swapIndex]] = [chars[swapIndex], chars[index]];
  }

  return chars.join("");
}

function generateLegacyResetSeed() {
  const chars = [
    LOWERCASE[randomInt(0, LOWERCASE.length)],
    UPPERCASE[randomInt(0, UPPERCASE.length)],
    "2",
  ];

  while (chars.length < LEGACY_RESET_SEED_LENGTH) {
    chars.push(MIXED_CASE_AND_DIGITS[randomInt(0, MIXED_CASE_AND_DIGITS.length)]);
  }

  for (let index = chars.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(0, index + 1);
    [chars[index], chars[swapIndex]] = [chars[swapIndex], chars[index]];
  }

  return chars.join("");
}

function isApprovedAndActive(user: Pick<StoredUser, "active" | "approvalStatus">) {
  return user.active && user.approvalStatus === "APPROVED";
}

function getBanDuration(user: Pick<StoredUser, "active" | "approvalStatus">) {
  return isApprovedAndActive(user) ? "none" : BLOCKED_BAN_DURATION;
}

function buildUserMetadata(user: Pick<StoredUser, "name" | "firstName" | "lastName" | "employeeId" | "dateOfBirth">) {
  return {
    name: user.name,
    first_name: user.firstName,
    last_name: user.lastName,
    employee_id: user.employeeId ?? undefined,
    date_of_birth: user.dateOfBirth ? user.dateOfBirth.toISOString().slice(0, 10) : undefined,
  };
}

function buildAppMetadata(user: Pick<StoredUser, "id" | "active" | "approvalStatus" | "role">) {
  return {
    app_user_id: user.id,
    role: user.role.code,
    approval_status: user.approvalStatus,
    active: user.active,
  };
}

async function getDefaultRole() {
  const prisma = getPrisma();
  if (!prisma) {
    throw new Error("DATABASE_UNAVAILABLE");
  }

  const role = await prisma.role.findUnique({ where: { code: DEFAULT_ROLE } });
  if (!role) {
    throw new Error("ROLE_NOT_FOUND");
  }

  return role;
}

async function assertNoDuplicateUser(email: string, employeeId: string) {
  const prisma = getPrisma();
  if (!prisma) {
    throw new Error("DATABASE_UNAVAILABLE");
  }

  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { employeeId }],
    },
    select: { id: true },
  });

  if (existing) {
    throw new Error("DUPLICATE_USER");
  }
}

async function fetchStoredUserById(userId: string) {
  const prisma = getPrisma();
  if (!prisma) {
    throw new Error("DATABASE_UNAVAILABLE");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true },
  });

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  return user as StoredUser;
}

async function createAppUserRecord(input: {
  form: ReturnType<typeof normalizeInput>;
  approvalStatus: "PENDING" | "APPROVED";
  active: boolean;
}) {
  const prisma = getPrisma();
  if (!prisma) {
    throw new Error("DATABASE_UNAVAILABLE");
  }

  await assertNoDuplicateUser(input.form.email, input.form.employeeId);
  const role = await getDefaultRole();

  const user = await prisma.user.create({
    data: {
      email: input.form.email,
      passwordHash: null,
      name: buildName(input.form.firstName, input.form.lastName),
      firstName: input.form.firstName,
      lastName: input.form.lastName,
      employeeId: input.form.employeeId,
      dateOfBirth: input.form.dateOfBirth,
      active: input.active,
      approvalStatus: input.approvalStatus,
      approvedAt: input.approvalStatus === "APPROVED" ? new Date() : null,
      rejectedAt: input.approvalStatus === "REJECTED" ? new Date() : null,
      roleId: role.id,
    },
    include: { role: true },
  });

  return user as StoredUser;
}

async function deleteAuthIdentity(authUserId: string | null) {
  if (!authUserId) {
    return;
  }

  try {
    const admin = getSupabaseAdminClient();
    await admin.auth.admin.deleteUser(authUserId);
  } catch {
    // Best-effort cleanup.
  }
}

async function deleteUserRecord(userId: string) {
  const prisma = getPrisma();
  if (!prisma) {
    return;
  }

  await prisma.user.delete({ where: { id: userId } }).catch(() => undefined);
}

async function syncAuthIdentityForUser(user: StoredUser, password: string) {
  const prisma = getPrisma();
  if (!prisma) {
    throw new Error("DATABASE_UNAVAILABLE");
  }

  const admin = getSupabaseAdminClient();
  const payload = {
    email: user.email,
    password,
    email_confirm: true,
    user_metadata: buildUserMetadata(user),
    app_metadata: buildAppMetadata(user),
    ban_duration: getBanDuration(user),
  };

  if (user.authUserId) {
    const { data, error } = await admin.auth.admin.updateUserById(user.authUserId, payload);
    if (error || !data.user) {
      throw error ?? new Error("SUPABASE_AUTH_UPDATE_FAILED");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: null },
    });

    return data.user.id;
  }

  const { data, error } = await admin.auth.admin.createUser(payload);
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

async function ensureResettableAuthIdentity(user: StoredUser) {
  if (user.authUserId) {
    return user.authUserId;
  }

  const generatedPassword = generateLegacyResetSeed();
  return syncAuthIdentityForUser(user, generatedPassword);
}

export async function submitRegistration(input: RegistrationInput) {
  const form = normalizeInput(input);
  const temporaryPassword = generateMixedCasePassword(TEMP_PASSWORD_LENGTH);
  const user = await createAppUserRecord({
    form,
    approvalStatus: "PENDING",
    active: true,
  });

  let authUserId: string | null = null;

  try {
    authUserId = await syncAuthIdentityForUser(user, temporaryPassword);

    await recordSecurityEvent({
      action: "auth.registration.submitted",
      success: true,
      targetType: "User",
      targetId: user.id,
      detail: "Public registration submitted.",
      metadata: { approvalStatus: "PENDING", role: DEFAULT_ROLE },
    });

    await recordSecurityEvent({
      action: "auth.temp_password.generated",
      success: true,
      targetType: "User",
      targetId: user.id,
      detail: "Temporary password generated for pending registration.",
      metadata: { length: TEMP_PASSWORD_LENGTH },
    });

    await sendTemporaryPasswordEmail({
      email: user.email,
      fullName: user.name,
      temporaryPassword,
      approvedImmediately: false,
    });
  } catch (error) {
    await deleteAuthIdentity(authUserId);
    await deleteUserRecord(user.id);
    await recordSecurityEvent({
      action: "auth.registration.email_failed",
      success: false,
      targetType: "User",
      targetId: user.id,
      detail: "Registration delivery or identity provisioning failed. Registration rolled back.",
    });
    throw error;
  }
}

export async function createUserByAdmin(actorId: string, input: RegistrationInput) {
  const form = normalizeInput(input);
  const temporaryPassword = generateMixedCasePassword(TEMP_PASSWORD_LENGTH);
  const user = await createAppUserRecord({
    form,
    approvalStatus: "APPROVED",
    active: true,
  });

  let authUserId: string | null = null;

  try {
    authUserId = await syncAuthIdentityForUser(user, temporaryPassword);

    await recordSecurityEvent({
      actorId,
      action: "auth.admin_user.created",
      success: true,
      targetType: "User",
      targetId: user.id,
      detail: "Administrator created user.",
      metadata: { role: DEFAULT_ROLE },
    });

    await recordSecurityEvent({
      actorId,
      action: "auth.temp_password.generated",
      success: true,
      targetType: "User",
      targetId: user.id,
      detail: "Temporary password generated for admin-created user.",
      metadata: { length: TEMP_PASSWORD_LENGTH },
    });

    await sendTemporaryPasswordEmail({
      email: user.email,
      fullName: user.name,
      temporaryPassword,
      approvedImmediately: true,
    });
  } catch (error) {
    await deleteAuthIdentity(authUserId);
    await deleteUserRecord(user.id);
    await recordSecurityEvent({
      actorId,
      action: "auth.admin_user.email_failed",
      success: false,
      targetType: "User",
      targetId: user.id,
      detail: "Admin-created user delivery or identity provisioning failed. User creation rolled back.",
    });
    throw error;
  }
}

export async function listPendingRegistrations() {
  const prisma = getPrisma();
  if (!prisma) {
    return [];
  }

  return prisma.user.findMany({
    where: { approvalStatus: "PENDING" },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      employeeId: true,
      createdAt: true,
      active: true,
      approvalStatus: true,
    },
  });
}

export async function listManagedUsers() {
  const prisma = getPrisma();
  if (!prisma) {
    return [];
  }

  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      employeeId: true,
      approvalStatus: true,
      active: true,
      createdAt: true,
      role: { select: { code: true } },
    },
  });
}

export async function decideRegistration(input: { actorId: string; userId: string; decision: "approve" | "reject" }) {
  const prisma = getPrisma();
  if (!prisma) {
    throw new Error("DATABASE_UNAVAILABLE");
  }

  const user = await fetchStoredUserById(input.userId);
  if (user.approvalStatus !== "PENDING") {
    throw new Error("REGISTRATION_NOT_PENDING");
  }

  if (user.id === input.actorId) {
    throw new Error("SELF_APPROVAL_BLOCKED");
  }

  const approved = input.decision === "approve";
  const updated = (await prisma.user.update({
    where: { id: user.id },
    data: {
      approvalStatus: approved ? "APPROVED" : "REJECTED",
      active: approved,
      approvedAt: approved ? new Date() : null,
      rejectedAt: approved ? null : new Date(),
    },
    include: { role: true },
  })) as StoredUser;

  if (updated.authUserId) {
    const admin = getSupabaseAdminClient();
    await admin.auth.admin.updateUserById(updated.authUserId, {
      user_metadata: buildUserMetadata(updated),
      app_metadata: buildAppMetadata(updated),
      ban_duration: getBanDuration(updated),
    });
  }

  await recordSecurityEvent({
    actorId: input.actorId,
    action: approved ? "auth.registration.approved" : "auth.registration.rejected",
    success: true,
    targetType: "User",
    targetId: updated.id,
    detail: approved ? "Pending registration approved." : "Pending registration rejected.",
  });
}

async function getResettableUser(email: string) {
  const prisma = getPrisma();
  if (!prisma) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: true },
  });

  return (user as StoredUser | null) ?? null;
}

export async function requestPasswordReset(emailInput: string) {
  const email = emailInput.trim().toLowerCase();
  if (!email) {
    return;
  }

  const user = await getResettableUser(email);
  if (!user) {
    await recordSecurityEvent({
      action: "auth.password_reset.request",
      success: true,
      detail: "Password reset requested for unknown email.",
      metadata: { matchedUser: false, emailLength: email.length },
    });
    return;
  }

  if (!isApprovedAndActive(user)) {
    await recordSecurityEvent({
      actorId: user.id,
      action: "auth.password_reset.request.blocked",
      success: false,
      targetType: "User",
      targetId: user.id,
      detail: "Password reset blocked because account is not approved and active.",
    });
    return;
  }

  let authUserId = user.authUserId;

  try {
    if (!authUserId) {
      authUserId = await ensureResettableAuthIdentity(user);
    }

    const origin = await getOriginFromHeaders();
    const callbackUrl = `${getAppBaseUrl(origin)}/auth/callback?next=/reset-password`;
    const admin = getSupabaseAdminClient();
    const { data, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email: user.email,
      options: { redirectTo: callbackUrl },
    } as any);

    const actionLink =
      data?.properties?.action_link ??
      data?.properties?.actionLink ??
      (data as any)?.action_link ??
      (data as any)?.actionLink;

    if (error || !actionLink) {
      throw error ?? new Error("SUPABASE_RECOVERY_LINK_FAILED");
    }

    await sendPasswordResetEmail({
      email: user.email,
      fullName: user.name,
      resetUrl: actionLink,
    });

    await recordSecurityEvent({
      actorId: user.id,
      action: "auth.password_reset.request",
      success: true,
      targetType: "User",
      targetId: user.id,
      detail: "Password reset email issued through Supabase recovery flow.",
    });
  } catch {
    await recordSecurityEvent({
      actorId: user.id,
      action: "auth.password_reset.email_failed",
      success: false,
      targetType: "User",
      targetId: user.id,
      detail: "Password reset delivery failed.",
    });
  }
}

async function resolveAuthenticatedResetUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return { supabase, user: null as StoredUser | null };
  }

  const prisma = getPrisma();
  if (!prisma) {
    return { supabase, user: null as StoredUser | null };
  }

  let user = (await prisma.user.findUnique({
    where: { authUserId: authUser.id },
    include: { role: true },
  })) as StoredUser | null;

  if (!user && authUser.email) {
    user = (await prisma.user.findUnique({
      where: { email: authUser.email.toLowerCase() },
      include: { role: true },
    })) as StoredUser | null;

    if (user && !user.authUserId) {
      user = (await prisma.user.update({
        where: { id: user.id },
        data: { authUserId: authUser.id },
        include: { role: true },
      })) as StoredUser;
    }
  }

  return { supabase, user };
}

export async function getResetSessionStatus() {
  const { supabase, user } = await resolveAuthenticatedResetUser();

  if (!user) {
    return { valid: false, message: "This reset link is invalid or expired." };
  }

  if (!isApprovedAndActive(user)) {
    await supabase.auth.signOut();
    return { valid: false, message: "This account is not eligible for password reset." };
  }

  return { valid: true, message: getPasswordPolicyHint(), email: user.email };
}

export async function completePasswordReset(input: { password: string }) {
  const { supabase, user } = await resolveAuthenticatedResetUser();
  const password = validatePasswordPolicy(input.password);

  if (!user || !isApprovedAndActive(user)) {
    throw new Error("RESET_SESSION_INVALID");
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    throw new Error("RESET_SESSION_INVALID");
  }

  const prisma = getPrisma();
  if (prisma) {
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: null },
    });
  }

  await recordSecurityEvent({
    actorId: user.id,
    action: "auth.password_reset.completed",
    success: true,
    targetType: "User",
    targetId: user.id,
    detail: "Password updated through Supabase recovery flow.",
  });

  await supabase.auth.signOut();
}

export function isEmailTransportError(error: unknown) {
  return error instanceof EmailDeliveryError;
}
