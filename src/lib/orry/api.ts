import type { ApiErrorResponse, ApiSuccessResponse } from "@/lib/orry/schema";

export function okResponse<T>(data: T, meta?: Record<string, string | number | boolean>): ApiSuccessResponse<T> {
  return { ok: true, data, meta };
}

export function validationError(message: string, details?: Record<string, string | number | boolean>): ApiErrorResponse {
  return { ok: false, error: { code: "VALIDATION_ERROR", message, details } };
}

export function notFoundError(message: string): ApiErrorResponse {
  return { ok: false, error: { code: "NOT_FOUND", message } };
}

export function invalidTransitionError(message: string): ApiErrorResponse {
  return { ok: false, error: { code: "INVALID_TRANSITION", message } };
}

export function inventoryViolationError(message: string): ApiErrorResponse {
  return { ok: false, error: { code: "INVENTORY_VIOLATION", message } };
}
