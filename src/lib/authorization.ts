import "server-only";
import type { UserSession, RoleCode, DocumentKind, DocumentStatus } from "@/lib/types";

export class SecurityError extends Error {
  constructor(message = "This action could not be completed.") {
    super(message);
    this.name = "SecurityError";
  }
}

export function requireUser<T extends { user?: UserSession } | null>(session: T): UserSession {
  if (!session?.user) {
    throw new SecurityError();
  }

  return session.user;
}

export function requireRole(user: UserSession, roles: RoleCode[]) {
  if (!roles.includes(user.role)) {
    throw new SecurityError();
  }
}

export function getDraftRoles(kind: DocumentKind): RoleCode[] {
  switch (kind) {
    case "PROPOSAL":
    case "SALES_ORDER":
      return ["ADMIN", "SALES", "EXECUTIVE"];
    case "BILLING_RECORD":
    case "RECEIPT":
    case "EXPENSE":
      return ["ADMIN", "FINANCE", "EXECUTIVE"];
    case "PURCHASE_ORDER":
      return ["ADMIN", "OPERATIONS", "EXECUTIVE"];
  }
}

export function assertStatusTransitionPolicy(input: {
  actor: UserSession;
  ownerId?: string;
  kind: DocumentKind;
  currentStatus: DocumentStatus;
  nextStatus: DocumentStatus;
  paymentTotal?: number;
  documentTotal?: number;
}) {
  const { actor, ownerId, kind, nextStatus, paymentTotal = 0, documentTotal = 0 } = input;

  if (nextStatus === "APPROVED") {
    requireRole(actor, ["ADMIN", "EXECUTIVE"]);
    if (ownerId && ownerId === actor.id) {
      throw new SecurityError();
    }
  }

  if (nextStatus === "PAID") {
    requireRole(actor, ["ADMIN", "FINANCE", "EXECUTIVE"]);
    if (!["BILLING_RECORD", "RECEIPT", "EXPENSE"].includes(kind)) {
      throw new SecurityError();
    }
    if (paymentTotal < documentTotal) {
      throw new SecurityError();
    }
  }

  if (nextStatus === "CANCELLED") {
    requireRole(actor, ["ADMIN", "EXECUTIVE"]);
  }

  if (nextStatus === "FULFILLED") {
    throw new SecurityError();
  }
}
