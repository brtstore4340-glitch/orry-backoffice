import { z } from "zod";

const runtimeSchema = z.object({
  NODE_ENV: z.string().optional(),
  AUTH_SECRET: z.string().min(1).optional(),
  DATABASE_URL: z.string().min(1).optional(),
  DIRECT_URL: z.string().min(1).optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  SUPABASE_STORAGE_BUCKET: z.string().min(1).optional(),
  APP_BASE_URL: z.string().url().optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM: z.string().email().optional(),
});

const parsed = runtimeSchema.safeParse({
  NODE_ENV: process.env.NODE_ENV,
  AUTH_SECRET: process.env.AUTH_SECRET,
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_STORAGE_BUCKET: process.env.SUPABASE_STORAGE_BUCKET,
  APP_BASE_URL: process.env.APP_BASE_URL,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM,
});

if (!parsed.success) {
  throw new Error("Runtime environment is invalid.");
}

export const env = parsed.data;

export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

export function isPlaceholder(value: string | undefined | null): boolean {
  if (!value) return true;
  const normalized = String(value).trim();
  if (!normalized) return true;

  return (
    normalized === "..." ||
    normalized === "changeme" ||
    normalized === "REPLACE_ME"
  );
}

export function getMissingMiddlewareEnv(): string[] {
  const missing: string[] = [];

  if (isPlaceholder(env.NEXT_PUBLIC_SUPABASE_URL)) {
    missing.push("NEXT_PUBLIC_SUPABASE_URL");
  }

  if (isPlaceholder(env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY)) {
    missing.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY");
  }

  return missing;
}

export function getMissingServerEnv(): string[] {
  const missing: string[] = [];

  if (isPlaceholder(env.DATABASE_URL)) {
    missing.push("DATABASE_URL");
  }

  if (isPlaceholder(env.NEXT_PUBLIC_SUPABASE_URL)) {
    missing.push("NEXT_PUBLIC_SUPABASE_URL");
  }

  if (isPlaceholder(env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY)) {
    missing.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY");
  }

  if (isPlaceholder(env.SUPABASE_SERVICE_ROLE_KEY)) {
    missing.push("SUPABASE_SERVICE_ROLE_KEY");
  }

  if (isPlaceholder(env.RESEND_API_KEY)) {
    missing.push("RESEND_API_KEY");
  }

  if (isPlaceholder(env.EMAIL_FROM)) {
    missing.push("EMAIL_FROM");
  }

  return missing;
}

export function assertMiddlewareEnv(): void {
  const missing = getMissingMiddlewareEnv();

  if (missing.length > 0) {
    throw new Error(
      `Missing middleware environment values: ${missing.join(", ")}`
    );
  }
}

export function assertServerEnv(): void {
  if (!isProduction()) return;

  const missing = getMissingServerEnv();

  if (missing.length > 0) {
    throw new Error(
      `Missing required production environment values: ${missing.join(", ")}`
    );
  }
}