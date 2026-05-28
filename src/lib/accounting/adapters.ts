import { randomUUID } from "crypto";
import { sendDocumentEmail } from "@/lib/email";
import { addDocumentAttachment, addDocumentEmailLog, addDocumentPayment, addDocumentShare, getDocumentDispatchInfo } from "@/lib/repository";
import type { DocumentModuleKey, PaymentMethod } from "@/lib/types";

export interface DocumentAttachmentAdapter {
  record(input: {
    documentId: string;
    uploadedById?: string;
    fileName: string;
    storagePath: string;
    mimeType?: string;
    fileSize?: number;
  }): Promise<void>;
}

export interface DocumentShareAdapter {
  record(input: {
    documentId: string;
    sharedById?: string;
    channel: string;
    sharedTo?: string;
    message?: string;
  }): Promise<{ shareToken: string }>;
}

export interface DocumentEmailAdapter {
  send(input: {
    documentId: string;
    sentTo: string;
    subject?: string;
    bodyPreview?: string;
    moduleKey: DocumentModuleKey;
  }): Promise<void>;
}

export interface DocumentPaymentAdapter {
  record(input: {
    documentId: string;
    actorId?: string;
    amount: number;
    method: PaymentMethod;
    referenceNumber?: string;
    note?: string;
    moduleKey: DocumentModuleKey;
  }): Promise<void>;
}

export const documentAttachmentAdapter: DocumentAttachmentAdapter = {
  async record(input) {
    await addDocumentAttachment(input);
  }
};

export const documentShareAdapter: DocumentShareAdapter = {
  async record(input) {
    const shareToken = randomUUID().replaceAll("-", "");
    await addDocumentShare({ ...input, shareToken });
    return { shareToken };
  }
};

export const documentEmailAdapter: DocumentEmailAdapter = {
  async send(input) {
    const dispatch = await getDocumentDispatchInfo(input.documentId);
    if (!dispatch) {
      throw new Error("DOCUMENT_NOT_FOUND");
    }

    let providerMessageId: string | undefined;
    let status = "queued";
    let failedAt: Date | undefined;
    let errorMessage: string | undefined;

    try {
      const result = await sendDocumentEmail({
        to: input.sentTo,
        subject: input.subject?.trim() || `${dispatch.title} ${dispatch.documentNumber}`,
        documentNumber: dispatch.documentNumber,
        documentTitle: dispatch.title,
        bodyPreview: input.bodyPreview?.trim(),
      });
      providerMessageId = result.providerMessageId;
      status = "sent";
    } catch (error) {
      status = "failed";
      failedAt = new Date();
      errorMessage = error instanceof Error ? error.message : "EMAIL_DELIVERY_FAILED";
    }

    await addDocumentEmailLog({
      documentId: input.documentId,
      sentTo: input.sentTo,
      subject: input.subject?.trim() || `${dispatch.title} ${dispatch.documentNumber}`,
      bodyPreview: input.bodyPreview?.trim() || undefined,
      providerMessageId,
      status,
      sentAt: status === "sent" ? new Date() : undefined,
      failedAt,
      errorMessage,
    });

    if (status === "failed") {
      throw new Error(errorMessage ?? "EMAIL_DELIVERY_FAILED");
    }
  }
};

export const documentPaymentAdapter: DocumentPaymentAdapter = {
  async record(input) {
    await addDocumentPayment({
      documentId: input.documentId,
      actorId: input.actorId,
      amount: input.amount,
      method: input.method,
      referenceNumber: input.referenceNumber,
      note: input.note,
      moduleKey: input.moduleKey,
    });
  }
};
