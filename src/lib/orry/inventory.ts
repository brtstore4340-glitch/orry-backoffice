import type { ReturnCondition, Stock } from "@/lib/orry/schema";

export class InventoryValidationError extends Error {
  constructor(message: string, public readonly code: "NEGATIVE_STOCK" | "CAPACITY_EXCEEDED" | "INVALID_RETURN" | "INVALID_QUANTITY") {
    super(message);
    this.name = "InventoryValidationError";
  }
}

export function calculateAvailableStock(stockOnHand: number, reserved: number) {
  return stockOnHand - reserved;
}

export function validateGoodsIssue(stock: Pick<Stock, "stockOnHand" | "reserved">, quantity: number) {
  if (quantity <= 0) {
    throw new InventoryValidationError("Issue quantity must be greater than zero.", "INVALID_QUANTITY");
  }

  if (calculateAvailableStock(stock.stockOnHand, stock.reserved) < quantity) {
    throw new InventoryValidationError("Cannot issue more than available stock.", "NEGATIVE_STOCK");
  }

  return true;
}

export function validateStockTransfer(input: { source: Pick<Stock, "stockOnHand" | "reserved">; target: Pick<Stock, "stockOnHand" | "maxCapacity">; quantity: number }) {
  validateGoodsIssue(input.source, input.quantity);

  if (input.target.stockOnHand + input.quantity > input.target.maxCapacity) {
    throw new InventoryValidationError("Transfer exceeds target warehouse capacity.", "CAPACITY_EXCEEDED");
  }

  return true;
}

export function validateReturn(quantity: number, condition: ReturnCondition) {
  if (quantity <= 0) {
    throw new InventoryValidationError("Return quantity must be greater than zero.", "INVALID_QUANTITY");
  }

  if (!["SELLABLE", "DAMAGED", "EXPIRED"].includes(condition)) {
    throw new InventoryValidationError("Return condition is invalid.", "INVALID_RETURN");
  }

  return true;
}

export function applyInventoryMutation(stock: Stock, input: { stockOnHandDelta?: number; reservedDelta?: number; condition?: ReturnCondition }) {
  const stockOnHand = stock.stockOnHand + (input.stockOnHandDelta ?? 0);
  const reserved = stock.reserved + (input.reservedDelta ?? 0);
  const available = calculateAvailableStock(stockOnHand, reserved);

  if (stockOnHand < 0 || reserved < 0 || available < 0) {
    throw new InventoryValidationError("Inventory mutation would create negative stock.", "NEGATIVE_STOCK");
  }

  return {
    ...stock,
    stockOnHand,
    reserved,
    available,
    condition: input.condition ?? stock.condition,
    updatedAt: new Date().toISOString(),
  };
}
