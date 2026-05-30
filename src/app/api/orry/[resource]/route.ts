import { NextResponse } from "next/server";
import { inventoryViolationError, invalidTransitionError, notFoundError, okResponse, validationError } from "@/lib/orry/api";
import type { ApiResourceKey } from "@/lib/orry/schema";
import { isKnownDomainError, listResource, createResource, updateResource } from "@/server/orry/store";

const RESOURCE_KEYS: ApiResourceKey[] = ["products", "customers", "vendors", "stock", "sales-orders", "purchase-orders", "invoices", "gl"];

function isApiResourceKey(value: string): value is ApiResourceKey {
  return RESOURCE_KEYS.includes(value as ApiResourceKey);
}

function statusFromError(error: unknown) {
  if (error instanceof Error && error.name === "WorkflowTransitionError") {
    return NextResponse.json(invalidTransitionError(error.message), { status: 409 });
  }

  if (error instanceof Error && error.name === "InventoryValidationError") {
    return NextResponse.json(inventoryViolationError(error.message), { status: 409 });
  }

  if (error instanceof Error) {
    return NextResponse.json(validationError(error.message), { status: 400 });
  }

  return NextResponse.json(validationError("Unknown request failure."), { status: 400 });
}

export async function GET(_request: Request, context: { params: Promise<{ resource: string }> }) {
  const { resource } = await context.params;
  if (!isApiResourceKey(resource)) {
    return NextResponse.json(notFoundError(`Resource ${resource} is not available.`), { status: 404 });
  }

  const data = await listResource(resource);
  return NextResponse.json(okResponse(data, { resource, mock: false, targetMs: 100 }));
}

export async function POST(request: Request, context: { params: Promise<{ resource: string }> }) {
  const { resource } = await context.params;
  if (!isApiResourceKey(resource)) {
    return NextResponse.json(notFoundError(`Resource ${resource} is not available.`), { status: 404 });
  }

  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const data = await createResource(resource, payload);
    return NextResponse.json(okResponse(data, { resource, operation: "create", mock: false }), { status: 201 });
  } catch (error) {
    return statusFromError(error);
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ resource: string }> }) {
  const { resource } = await context.params;
  if (!isApiResourceKey(resource)) {
    return NextResponse.json(notFoundError(`Resource ${resource} is not available.`), { status: 404 });
  }

  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const data = await updateResource(resource, payload);

    if (!data) {
      return NextResponse.json(notFoundError(`Record ${String(payload.id ?? "")} was not found.`), { status: 404 });
    }

    return NextResponse.json(okResponse(data, { resource, operation: "update", mock: false }));
  } catch (error) {
    if (isKnownDomainError(error)) {
      return statusFromError(error);
    }

    return statusFromError(error);
  }
}
