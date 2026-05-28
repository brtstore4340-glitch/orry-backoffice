"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { recordSecurityEvent } from "@/lib/audit";
import { documentAttachmentAdapter, documentEmailAdapter, documentPaymentAdapter, documentShareAdapter } from "@/lib/accounting/adapters";
import { getModuleConfig } from "@/lib/accounting/modules";
import { assertStatusTransitionPolicy, getDraftRoles, requireRole, requireUser, SecurityError } from "@/lib/authorization";
import { addDocumentLine, createContact, createDraftDocument, createInventoryReceivingDraft, createWithholdingTaxDraft, getDocumentPolicyData, updateDocumentContact, updateDocumentLine, updateDocumentStatus, updateInventoryReceivingStatus, updateWithholdingTaxStatus } from "@/lib/repository";
import { DocumentKind, DocumentModuleKey, DocumentStatus, PaymentMethod, RoleCode, UserSession } from "@/lib/types";

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

function getModuleDetailRedirect(moduleKey: DocumentModuleKey, id: string) {
  return getModuleConfig(moduleKey)?.detailPath?.(id) ?? `/documents/${id}`;
}

function getModuleListRedirect(moduleKey: DocumentModuleKey) {
  return getModuleConfig(moduleKey)?.listPath ?? "/dashboard";
}

function getBaseKind(moduleKey: DocumentModuleKey): DocumentKind | undefined {
  const kind = getModuleConfig(moduleKey)?.kind;
  switch (kind) {
    case "quotation":
      return "PROPOSAL";
    case "billing_note":
    case "cash_invoice":
    case "tax_invoice":
      return "BILLING_RECORD";
    case "receipt":
      return "RECEIPT";
    case "expense":
      return "EXPENSE";
    case "purchase_order":
      return "PURCHASE_ORDER";
    default:
      return undefined;
  }
}

function isPersistedDocumentModule(moduleKey: DocumentModuleKey): moduleKey is Exclude<DocumentModuleKey, "inventory_receiving" | "withholding_tax"> {
  return moduleKey !== "inventory_receiving" && moduleKey !== "withholding_tax";
}

function defaultModuleKeyForKind(kind: DocumentKind) {
  switch (kind) {
    case "PROPOSAL":
      return "quotation" as const;
    case "RECEIPT":
      return "receipt" as const;
    case "EXPENSE":
      return "expense" as const;
    case "PURCHASE_ORDER":
      return "purchase_order" as const;
    case "SALES_ORDER":
      return "purchase_order" as const;
    case "BILLING_RECORD":
      return "billing_note" as const;
  }
}

export async function createContactAction(formData: FormData) {
  const user = await requireAuthorizedUser(["ADMIN", "SALES", "OPERATIONS", "EXECUTIVE"], "contact.create", "Contact");
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
  redirect("/contacts?status=created");
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
  const document = await createDraftDocument({ kind, moduleKey: defaultModuleKeyForKind(kind), note: note || undefined, actorId: user.id });
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

export async function createAccountingModuleDraftAction(formData: FormData) {
  const moduleKey = String(formData.get("moduleKey") ?? "") as DocumentModuleKey;
  const note = String(formData.get("note") ?? "").trim();
  const branchId = String(formData.get("branchId") ?? "").trim();
  const baseKind = getBaseKind(moduleKey);
  const user = await requireAuthorizedUser(baseKind ? getDraftRoles(baseKind) : ["ADMIN", "SALES", "FINANCE", "OPERATIONS", "EXECUTIVE"], "accounting.document.draft", "BusinessDocument");

  if (!baseKind && moduleKey === "inventory_receiving") {
    const document = await createInventoryReceivingDraft({ note: note || undefined, branchId: branchId || undefined });
    await recordSecurityEvent({
      actorId: user.id,
      action: "accounting.inventory_receiving.draft",
      success: true,
      targetType: "InventoryReceipt",
      targetId: document?.id,
      detail: "Inventory receiving draft created."
    });
    revalidatePath(getModuleListRedirect(moduleKey));
    if (document?.id) {
      redirect(getModuleDetailRedirect(moduleKey, document.id));
    }
    redirect(`${getModuleListRedirect(moduleKey)}?status=created`);
  }

  if (!baseKind && moduleKey === "withholding_tax") {
    const document = await createWithholdingTaxDraft({ note: note || undefined });
    await recordSecurityEvent({
      actorId: user.id,
      action: "accounting.withholding_tax.draft",
      success: true,
      targetType: "WithholdingTaxDocument",
      targetId: document?.id,
      detail: "Withholding tax draft created."
    });
    revalidatePath(getModuleListRedirect(moduleKey));
    if (document?.id) {
      redirect(getModuleDetailRedirect(moduleKey, document.id));
    }
    redirect(`${getModuleListRedirect(moduleKey)}?status=created`);
  }

  if (!baseKind || !isPersistedDocumentModule(moduleKey)) {
    throw genericActionError();
  }

  const document = await createDraftDocument({ kind: baseKind, moduleKey, note: note || undefined, actorId: user.id, branchId: branchId || undefined });
  await recordSecurityEvent({
    actorId: user.id,
    action: "accounting.document.draft",
    success: true,
    targetType: "BusinessDocument",
    targetId: document?.id,
    detail: "Accounting draft created.",
    metadata: { moduleKey, kind: baseKind }
  });

  revalidatePath(getModuleListRedirect(moduleKey));
  if (document?.id) {
    redirect(getModuleDetailRedirect(moduleKey, document.id));
  }
  redirect(`${getModuleListRedirect(moduleKey)}?status=created`);
}

export async function updateAccountingDocumentStatusAction(formData: FormData) {
  const moduleKey = String(formData.get("moduleKey") ?? "") as DocumentModuleKey;
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as DocumentStatus;
  const baseKind = getBaseKind(moduleKey);

  if (!id || !status) {
    throw genericActionError();
  }

  const session = await auth();
  const user = requireUser(session);

  if (!baseKind && moduleKey === "inventory_receiving") {
    await updateInventoryReceivingStatus({ id, status });
    revalidatePath(getModuleDetailRedirect(moduleKey, id));
    revalidatePath(getModuleListRedirect(moduleKey));
    redirect(getModuleDetailRedirect(moduleKey, id));
  }

  if (!baseKind && moduleKey === "withholding_tax") {
    await updateWithholdingTaxStatus({ id, status });
    revalidatePath(getModuleDetailRedirect(moduleKey, id));
    revalidatePath(getModuleListRedirect(moduleKey));
    redirect(getModuleDetailRedirect(moduleKey, id));
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
    metadata: { requestedStatus: status, moduleKey }
  });
  revalidatePath(getModuleDetailRedirect(moduleKey, id));
  revalidatePath(getModuleListRedirect(moduleKey));
  redirect(getModuleDetailRedirect(moduleKey, id));
}

export async function duplicateAccountingDocumentAction(formData: FormData) {
  const moduleKey = String(formData.get("moduleKey") ?? "") as DocumentModuleKey;
  const id = String(formData.get("id") ?? "");
  const baseKind = getBaseKind(moduleKey);
  const session = await auth();
  const user = requireUser(session);

  if (!baseKind || !isPersistedDocumentModule(moduleKey)) {
    revalidatePath(getModuleDetailRedirect(moduleKey, id));
    redirect(getModuleDetailRedirect(moduleKey, id));
  }

  const source = await getDocumentPolicyData(id);
  if (!source) {
    throw genericActionError();
  }

  const document = await createDraftDocument({ kind: baseKind, moduleKey, note: `สำเนาจาก ${id}`, actorId: user.id });
  await recordSecurityEvent({
    actorId: user.id,
    action: "document.duplicated",
    success: true,
    targetType: "BusinessDocument",
    targetId: document?.id,
    detail: "Document duplicated.",
    metadata: { moduleKey, sourceId: id }
  });

  revalidatePath(getModuleListRedirect(moduleKey));
  if (document?.id) {
    redirect(getModuleDetailRedirect(moduleKey, document.id));
  }
  redirect(getModuleListRedirect(moduleKey));
}

export async function recordAccountingDocumentShareAction(formData: FormData) {
  const moduleKey = String(formData.get("moduleKey") ?? "") as DocumentModuleKey;
  const id = String(formData.get("id") ?? "");
  const channel = String(formData.get("channel") ?? "").trim() || "ลิงก์";
  const sharedTo = String(formData.get("sharedTo") ?? "").trim() || undefined;
  const message = String(formData.get("message") ?? "").trim() || undefined;
  const session = await auth();
  const user = requireUser(session);
  await documentShareAdapter.record({ documentId: id, sharedById: user.id, channel, sharedTo, message });
  await recordSecurityEvent({
    actorId: user.id,
    action: "document.share.recorded",
    success: true,
    targetType: "BusinessDocument",
    targetId: id,
    detail: "Document share recorded.",
    metadata: { moduleKey }
  });
  revalidatePath(getModuleDetailRedirect(moduleKey, id));
  redirect(getModuleDetailRedirect(moduleKey, id));
}

export async function recordAccountingDocumentEmailAction(formData: FormData) {
  const moduleKey = String(formData.get("moduleKey") ?? "") as DocumentModuleKey;
  const id = String(formData.get("id") ?? "");
  const sentTo = String(formData.get("sentTo") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim() || undefined;
  const bodyPreview = String(formData.get("bodyPreview") ?? "").trim() || undefined;
  const session = await auth();
  const user = requireUser(session);
  await documentEmailAdapter.send({ documentId: id, sentTo, subject, bodyPreview, moduleKey });
  await recordSecurityEvent({
    actorId: user.id,
    action: "document.email.recorded",
    success: true,
    targetType: "BusinessDocument",
    targetId: id,
    detail: "Document email recorded.",
    metadata: { moduleKey }
  });
  revalidatePath(getModuleDetailRedirect(moduleKey, id));
  redirect(getModuleDetailRedirect(moduleKey, id));
}

export async function recordAccountingDocumentAttachmentAction(formData: FormData) {
  const moduleKey = String(formData.get("moduleKey") ?? "") as DocumentModuleKey;
  const id = String(formData.get("id") ?? "");
  const fileName = String(formData.get("fileName") ?? "").trim();
  const storagePath = String(formData.get("storagePath") ?? "").trim();
  const mimeType = String(formData.get("mimeType") ?? "").trim() || undefined;
  const fileSizeValue = String(formData.get("fileSize") ?? "").trim();
  const session = await auth();
  const user = requireUser(session);
  await documentAttachmentAdapter.record({
    documentId: id,
    uploadedById: user.id,
    fileName,
    storagePath,
    mimeType,
    fileSize: fileSizeValue ? Number(fileSizeValue) : undefined
  });
  await recordSecurityEvent({
    actorId: user.id,
    action: "document.attachment.recorded",
    success: true,
    targetType: "BusinessDocument",
    targetId: id,
    detail: "Document attachment recorded.",
    metadata: { moduleKey }
  });
  revalidatePath(getModuleDetailRedirect(moduleKey, id));
  redirect(getModuleDetailRedirect(moduleKey, id));
}

export async function recordAccountingDocumentPaymentAction(formData: FormData) {
  const moduleKey = String(formData.get("moduleKey") ?? "") as DocumentModuleKey;
  const id = String(formData.get("id") ?? "");
  const amount = Number(String(formData.get("amount") ?? "0").trim());
  const method = String(formData.get("method") ?? "TRANSFER") as PaymentMethod;
  const referenceNumber = String(formData.get("referenceNumber") ?? "").trim() || undefined;
  const note = String(formData.get("note") ?? "").trim() || undefined;
  const session = await auth();
  const user = requireUser(session);
  await documentPaymentAdapter.record({ documentId: id, actorId: user.id, amount, method, referenceNumber, note, moduleKey });
  await recordSecurityEvent({
    actorId: user.id,
    action: "document.payment.recorded",
    success: true,
    targetType: "BusinessDocument",
    targetId: id,
    detail: "Document payment recorded.",
    metadata: { moduleKey }
  });
  revalidatePath(getModuleDetailRedirect(moduleKey, id));
  redirect(getModuleDetailRedirect(moduleKey, id));
}

export async function updateAccountingDocumentContactAction(formData: FormData) {
  const moduleKey = String(formData.get("moduleKey") ?? "") as DocumentModuleKey;
  const id = String(formData.get("id") ?? "");
  const contactId = String(formData.get("contactId") ?? "").trim();
  const session = await auth();
  const user = requireUser(session);

  if (!id || !contactId) {
    throw genericActionError();
  }

  await updateDocumentContact({ documentId: id, contactId, actorId: user.id });
  await recordSecurityEvent({
    actorId: user.id,
    action: "document.contact.updated",
    success: true,
    targetType: "BusinessDocument",
    targetId: id,
    detail: "Document contact updated.",
    metadata: { moduleKey },
  });
  revalidatePath(getModuleListRedirect(moduleKey));
  revalidatePath(getModuleDetailRedirect(moduleKey, id));
  redirect(getModuleDetailRedirect(moduleKey, id));
}

export async function addAccountingDocumentLineAction(formData: FormData) {
  const moduleKey = String(formData.get("moduleKey") ?? "") as DocumentModuleKey;
  const id = String(formData.get("id") ?? "");
  const productId = String(formData.get("productId") ?? "").trim();
  const quantity = Number(String(formData.get("quantity") ?? "1").trim());
  const unitPriceValue = String(formData.get("unitPrice") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || undefined;
  const session = await auth();
  const user = requireUser(session);

  if (!id || !productId) {
    throw genericActionError();
  }

  await addDocumentLine({
    documentId: id,
    productId,
    quantity,
    unitPrice: unitPriceValue ? Number(unitPriceValue) : undefined,
    description,
    actorId: user.id,
  });
  await recordSecurityEvent({
    actorId: user.id,
    action: "document.line.added",
    success: true,
    targetType: "BusinessDocument",
    targetId: id,
    detail: "Document line added.",
    metadata: { moduleKey },
  });
  revalidatePath(getModuleListRedirect(moduleKey));
  revalidatePath(getModuleDetailRedirect(moduleKey, id));
  redirect(getModuleDetailRedirect(moduleKey, id));
}

export async function updateAccountingDocumentLineAction(formData: FormData) {
  const moduleKey = String(formData.get("moduleKey") ?? "") as DocumentModuleKey;
  const id = String(formData.get("id") ?? "");
  const lineId = String(formData.get("lineId") ?? "").trim();
  const quantity = Number(String(formData.get("quantity") ?? "1").trim());
  const unitPrice = Number(String(formData.get("unitPrice") ?? "0").trim());
  const description = String(formData.get("description") ?? "").trim() || undefined;
  const session = await auth();
  const user = requireUser(session);

  if (!id || !lineId) {
    throw genericActionError();
  }

  await updateDocumentLine({
    documentId: id,
    lineId,
    quantity,
    unitPrice,
    description,
    actorId: user.id,
  });
  await recordSecurityEvent({
    actorId: user.id,
    action: "document.line.updated",
    success: true,
    targetType: "BusinessDocument",
    targetId: id,
    detail: "Document line updated.",
    metadata: { moduleKey, lineId },
  });
  revalidatePath(getModuleListRedirect(moduleKey));
  revalidatePath(getModuleDetailRedirect(moduleKey, id));
  redirect(getModuleDetailRedirect(moduleKey, id));
}
