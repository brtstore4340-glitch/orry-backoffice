import "server-only";
import { z } from "zod";

const placeholderValues = new Set([
  "replace-with-a-long-random-secret",
  "set-a-32-plus-character-random-secret-before-production",
  "your-supabase-publishable-key",
  "set-your-supabase-publishable-key",
  "your-supabase-service-role-key",
  "optional-only-if-a-trusted-server-path-explicitly-needs-it",
  "https://[project-ref].supabase.co",
  "postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1",
  "postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
]);

const runtimeSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  AUTH_SECRET: z.string().min(32).optional(),
  DATABASE_URL: z.string().min(1).optional(),
  DIRECT_URL: z.string().min(1).optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  SUPABASE_STORAGE_BUCKET: z.string().min(1).optional()
});

export type RuntimeEnv = z.infer<typeof runtimeSchema>;

let cachedEnv: RuntimeEnv | null = null;

function isPlaceholder(value: string | undefined) {
  return !value || placeholderValues.has(value.trim());
}

export function isProduction() {
  return process.env.NODE_ENV === "production";
}

export function getRuntimeEnv(): RuntimeEnv {
  if (cachedEnv) {
    return cachedEnv;
  }

  const parsed = runtimeSchema.safeParse({
    NODE_ENV: process.env.NODE_ENV,
    AUTH_SECRET: process.env.AUTH_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_STORAGE_BUCKET: process.env.SUPABASE_STORAGE_BUCKET
  });

  if (!parsed.success) {
    throw new Error("Runtime environment is invalid.");
  }

  const env = parsed.data;

  if (env.NODE_ENV === "production") {
    const missing: string[] = [];
    if (isPlaceholder(env.AUTH_SECRET)) missing.push("AUTH_SECRET");
    if (isPlaceholder(env.DATABASE_URL)) missing.push("DATABASE_URL");
    if (isPlaceholder(env.DIRECT_URL)) missing.push("DIRECT_URL");
    if (isPlaceholder(env.NEXT_PUBLIC_SUPABASE_URL)) missing.push("NEXT_PUBLIC_SUPABASE_URL");
    if (isPlaceholder(env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY)) missing.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY");

    if (missing.length) {
      throw new Error(`Missing required production environment values: ${missing.join(", ")}`);
    }
  }

  cachedEnv = env;
  return env;
}
