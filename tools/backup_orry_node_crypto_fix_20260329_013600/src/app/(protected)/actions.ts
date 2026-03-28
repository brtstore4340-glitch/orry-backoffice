"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { createContact, createDraftDocument, updateDocumentStatus } from "@/lib/repository";
import { DocumentKind, DocumentStatus } from "@/lib/types";

export async function createContactAction(formData: FormData) {
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const displayName = String(formData.get("displayName") ?? "").trim();
  const contactPerson = String(formData.get("contactPerson") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();

  if (!code || !displayName) {
    return;
  }

  await createContact({ code, displayName, contactPerson: contactPerson || undefined, email: email || undefined });
  revalidatePath("/contacts");
}

export async function updateDocumentStatusAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as DocumentStatus;
  const session = await auth();

  if (!id || !status) {
    return;
  }

  await updateDocumentStatus({ id, status, actorId: session?.user?.id });
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
    return;
  }

  await createDraftDocument({ kind, note: note || undefined });

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