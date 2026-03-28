import "server-only";
import { headers } from "next/headers";
import { getPrisma } from "@/lib/db";

export interface SecurityEventInput {
  actorId?: string;
  action: string;
  success: boolean;
  targetType?: string;
  targetId?: string;
  detail?: string;
  metadata?: Record<string, string | number | boolean | null | undefined>;
}

function sanitizeMetadata(metadata?: Record<string, string | number | boolean | null | undefined>) {
  if (!metadata) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(metadata).filter(([, value]) => value !== undefined)
  );
}

async function getRequestContext() {
  const requestHeaders = await headers();
  const forwardedFor = requestHeaders.get("x-forwarded-for") ?? "";
  const ipAddress = forwardedFor.split(",")[0]?.trim() || requestHeaders.get("x-real-ip") || undefined;
  const userAgent = requestHeaders.get("user-agent") || undefined;

  return { ipAddress, userAgent };
}

export async function recordSecurityEvent(input: SecurityEventInput) {
  const prisma = getPrisma() as any;
  if (!prisma) {
    return;
  }

  const { ipAddress, userAgent } = await getRequestContext();
  const metadata = sanitizeMetadata(input.metadata);

  try {
    await prisma.securityEvent.create({
      data: {
        actorId: input.actorId,
        action: input.action,
        success: input.success,
        targetType: input.targetType,
        targetId: input.targetId,
        detail: input.detail,
        ipAddress,
        userAgent,
        metadataJson: metadata ? JSON.stringify(metadata) : null
      }
    });
  } catch {
    return;
  }
}
