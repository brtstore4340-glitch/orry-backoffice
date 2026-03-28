"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { recordSecurityEvent } from "@/lib/audit";
import { assertStatusTransitionPolicy, getDraftRoles, requireRole, requireUser, SecurityError } from "@/lib/authorization";
import { createContact, createDraftDocument, getDocumentPolicyData, updateDocumentStatus } from "@/lib/repository";
import { DocumentKind, DocumentStatus, RoleCode, UserSession } from "@/lib/types";

function genericActionError() {
  return new SecurityError();
}

async function requireAuthorizedUser(roles: RoleCode[], action: string, targetType?: string, targetId?: string): Promise<UserSession> {
  const session = await auth();
  const user = requireUser(session);

  try {
    requireRole(user, roles);
    return user;
  } catch (error) {
    await recordSecurityEvent({
      actorId: user.id,
      action,
      success: false,
      targetType,
      targetId,
      detail: "Permission denied."
    });
    throw error;
  }
}

export async function createContactAction(formData: FormData) {
  const user = await requireAuthorizedUser(["ADMIN", "SALES", "OPERATIONS", "EXECUTIVE"], "contact.create.denied", "Contact");
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const displayName = String(formData.get("displayName") ?? "").trim();
  const contactPerson = String(formData.get("contactPerson") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();

  if (!code || !displayName) {
    throw genericActionError();
  }

  const contact = await createContact({ code, displayName, contactPerson: contactPerson || undefined, email: email || undefined });
  await recordSecurityEvent({
    actorId: user.id,
    action: "contact.create",
    success: true,
    targetType: "Contact",
    targetId: contact?.id,
    detail: "Contact record created."
  });
  revalidatePath("/contacts");
}

export async function updateDocumentStatusAction(formData: FormData) {
  const session = await auth();
  const user = requireUser(session);
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as DocumentStatus;

  if (!id || !status) {
    throw genericActionError();
  }

  const document = await getDocumentPolicyData(id);
  if (!document) {
    throw genericActionError();
  }

  try {
    assertStatusTransitionPolicy({
      actor: user,
      ownerId: document.ownerId,
      kind: document.kind,
      currentStatus: document.status,
      nextStatus: status,
      paymentTotal: document.paymentTotal,
      documentTotal: document.totalAmount
    });
  } catch (error) {
    await recordSecurityEvent({
      actorId: user.id,
      action: "document.status.denied",
      success: false,
      targetType: "BusinessDocument",
      targetId: id,
      detail: "Document status update denied.",
      metadata: { requestedStatus: status }
    });
    throw error;
  }

  await updateDocumentStatus({ id, status, actorId: user.id });
  await recordSecurityEvent({
    actorId: user.id,
    action: "document.status.updated",
    success: true,
    targetType: "BusinessDocument",
    targetId: id,
    detail: "Document status updated.",
    metadata: { requestedStatus: status }
  });
  revalidatePath(`/documents/${id}`);
  revalidatePath("/dashboard");
  revalidatePath("/proposals");
  revalidatePath("/orders");
  revalidatePath("/billing");
  revalidatePath("/receipts");
}

export async function createDraftDocumentAction(formData: FormData) {
  const kind = String(formData.get("kind") ?? "") as DocumentKind;
  const note = String(formData.get("note") ?? "").trim();

  if (!kind) {
    throw genericActionError();
  }

  const user = await requireAuthorizedUser(getDraftRoles(kind), "document.draft.denied", "BusinessDocument");
  const document = await createDraftDocument({ kind, note: note || undefined, actorId: user.id });
  await recordSecurityEvent({
    actorId: user.id,
    action: "document.draft.created",
    success: true,
    targetType: "BusinessDocument",
    targetId: document?.id,
    detail: "Draft document created.",
    metadata: { kind }
  });

  const pathMap: Record<DocumentKind, string> = {
    PROPOSAL: "/proposals",
    SALES_ORDER: "/orders",
    BILLING_RECORD: "/billing",
    RECEIPT: "/receipts",
    PURCHASE_ORDER: "/orders",
    EXPENSE: "/payments"
  };

  revalidatePath(pathMap[kind]);
  revalidatePath("/dashboard");
}
