import { DocumentStatus as PrismaDocumentStatus } from "@prisma/client";
import { canTransition, WorkflowTransitionError } from "@/lib/orry/workflow";
import { InventoryValidationError, validateReturn } from "@/lib/orry/inventory";
import type { DocumentStatus, ReturnCondition } from "@/lib/orry/schema";

export type StoreDocumentResource = "sales-orders" | "purchase-orders" | "invoices" | "gl";
export type PersistedDocumentStatus = PrismaDocumentStatus;

export interface ShipmentLineInput {
  productId: string;
  quantity: number;
  stockOnHand: number;
  balanceQuantity: number;
}

export interface ShipmentPlan {
  nextDbStatus: PersistedDocumentStatus;
  movementType: string;
  balanceUpdates: Array<{ productId: string; nextQuantity: number; nextStockOnHand: number; quantityDelta: number }>;
}

export interface InventoryOperationPlan {
  movementType: string;
  quantityDelta: number;
  nextBalanceQuantity: number;
  nextProductStockOnHand: number;
}

export function mapDbStatusToOrry(resource: StoreDocumentResource, status: PersistedDocumentStatus): DocumentStatus {
  if (status === "DRAFT") return "DRAFT";
  if (status === "AWAITING_APPROVAL") return "PENDING";
  if (status === "APPROVED") return "APPROVED";
  if (status === "CANCELLED") return "CANCELLED";
  if (resource === "sales-orders" && status === "FULFILLED") return "POSTED";
  if (resource === "purchase-orders" && status === "RECEIVED") return "POSTED";
  if ((resource === "invoices" || resource === "gl") && status === "ISSUED") return "POSTED";
  if (status === "FULFILLED" || status === "ISSUED" || status === "RECEIVED") return "POSTED";
  return "DRAFT";
}

export function mapOrryStatusToDb(resource: StoreDocumentResource, status: DocumentStatus): PersistedDocumentStatus {
  if (status === "DRAFT") return "DRAFT";
  if (status === "PENDING") return "AWAITING_APPROVAL";
  if (status === "APPROVED") return "APPROVED";
  if (status === "CANCELLED") return "CANCELLED";
  if (resource === "sales-orders") return "FULFILLED";
  if (resource === "purchase-orders") return "RECEIVED";
  return "ISSUED";
}

export function assertTransitionAllowed(resource: StoreDocumentResource, currentDbStatus: PersistedDocumentStatus, nextOrryStatus: DocumentStatus) {
  const currentOrryStatus = mapDbStatusToOrry(resource, currentDbStatus);
  if (!canTransition(currentOrryStatus, nextOrryStatus)) {
    throw new WorkflowTransitionError(currentOrryStatus, nextOrryStatus);
  }
  return mapOrryStatusToDb(resource, nextOrryStatus);
}

export function shouldApplySalesOrderShipment(currentDbStatus: PersistedDocumentStatus, nextOrryStatus: DocumentStatus) {
  return mapDbStatusToOrry("sales-orders", currentDbStatus) === "APPROVED" && nextOrryStatus === "POSTED";
}

export function assertCreatorCannotSelfApprove(ownerId: string | null | undefined, actorId: string | undefined, nextStatus: DocumentStatus) {
  if (nextStatus === "APPROVED" && ownerId && actorId && ownerId === actorId) {
    throw new WorkflowTransitionError("PENDING", nextStatus, "Creators cannot approve their own record.");
  }
}

export function buildShipmentPlan(input: {
  currentDbStatus: PersistedDocumentStatus;
  actorId?: string;
  ownerId?: string | null;
  alreadyShipped: boolean;
  lines: ShipmentLineInput[];
}): ShipmentPlan {
  assertCreatorCannotSelfApprove(input.ownerId, input.actorId, "POSTED");
  const nextDbStatus = assertTransitionAllowed("sales-orders", input.currentDbStatus, "POSTED");

  if (input.alreadyShipped) {
    throw new InventoryValidationError("Sales Order shipment has already been confirmed.", "INVALID_QUANTITY");
  }

  const balanceUpdates = input.lines.map((line) => {
    if (line.quantity <= 0) {
      throw new InventoryValidationError("Shipment quantity must be greater than zero.", "INVALID_QUANTITY");
    }
    if (line.balanceQuantity < line.quantity || line.stockOnHand < line.quantity) {
      throw new InventoryValidationError("Shipment would create negative inventory.", "NEGATIVE_STOCK");
    }
    return {
      productId: line.productId,
      nextQuantity: line.balanceQuantity - line.quantity,
      nextStockOnHand: line.stockOnHand - line.quantity,
      quantityDelta: -line.quantity,
    };
  });

  return {
    nextDbStatus,
    movementType: "SALES_ORDER_SHIPMENT",
    balanceUpdates,
  };
}

export function buildInventoryOperationPlan(input: {
  operation: "issue" | "adjustment" | "return";
  approved?: boolean;
  quantity: number;
  balanceQuantity: number;
  stockOnHand: number;
  condition?: ReturnCondition;
}): InventoryOperationPlan {
  if (!input.approved) {
    throw new InventoryValidationError("Stock-affecting transactions require approval before inventory changes.", "INVALID_QUANTITY");
  }

  if (input.quantity <= 0) {
    throw new InventoryValidationError("Quantity must be greater than zero.", "INVALID_QUANTITY");
  }

  if (input.operation === "issue" || input.operation === "adjustment") {
    if (input.balanceQuantity < input.quantity || input.stockOnHand < input.quantity) {
      throw new InventoryValidationError("Inventory cannot go negative.", "NEGATIVE_STOCK");
    }
    return {
      movementType: input.operation === "issue" ? "MANUAL_ISSUE" : "APPROVED_ADJUSTMENT",
      quantityDelta: -input.quantity,
      nextBalanceQuantity: input.balanceQuantity - input.quantity,
      nextProductStockOnHand: input.stockOnHand - input.quantity,
    };
  }

  validateReturn(input.quantity, input.condition ?? "SELLABLE");
  const restock = (input.condition ?? "SELLABLE") === "SELLABLE";
  return {
    movementType: `RETURN_${(input.condition ?? "SELLABLE").toUpperCase()}`,
    quantityDelta: restock ? input.quantity : 0,
    nextBalanceQuantity: restock ? input.balanceQuantity + input.quantity : input.balanceQuantity,
    nextProductStockOnHand: restock ? input.stockOnHand + input.quantity : input.stockOnHand,
  };
}
