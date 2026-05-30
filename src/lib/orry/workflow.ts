import type { DocumentStatus, WorkflowDocument } from "@/lib/orry/schema";

const TRANSITIONS: Record<DocumentStatus, DocumentStatus[]> = {
  DRAFT: ["PENDING", "CANCELLED"],
  PENDING: ["APPROVED", "CANCELLED"],
  APPROVED: ["POSTED", "CANCELLED"],
  POSTED: [],
  CANCELLED: [],
};

export class WorkflowTransitionError extends Error {
  constructor(public readonly from: DocumentStatus, public readonly to: DocumentStatus, message = `Cannot transition document from ${from} to ${to}.`) {
    super(message);
    this.name = "WorkflowTransitionError";
  }
}

export function canTransition(from: DocumentStatus, to: DocumentStatus) {
  return TRANSITIONS[from].includes(to);
}

export function getAvailableTransitions(status: DocumentStatus) {
  return [...TRANSITIONS[status]];
}

export function transitionDocument<T extends WorkflowDocument>(document: T, nextStatus: DocumentStatus, options?: { actorId?: string }) {
  if (!canTransition(document.status, nextStatus)) {
    throw new WorkflowTransitionError(document.status, nextStatus);
  }

  if (nextStatus === "APPROVED" && options?.actorId && options.actorId === document.createdByUserId) {
    throw new WorkflowTransitionError(document.status, nextStatus, "Creators cannot approve their own documents.");
  }

  const updatedAt = new Date().toISOString();
  return {
    ...document,
    status: nextStatus,
    approvedByUserId: nextStatus === "APPROVED" ? options?.actorId ?? document.approvedByUserId : document.approvedByUserId,
    postedAt: nextStatus === "POSTED" ? updatedAt : document.postedAt,
    updatedAt,
  };
}
