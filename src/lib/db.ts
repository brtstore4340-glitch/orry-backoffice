import { getRuntimeEnv, isProduction } from "@/lib/env";

declare global {
  var prismaGlobal: any | undefined;
}

export function getPrisma() {
  const env = getRuntimeEnv();

  if (!env.DATABASE_URL) {
    if (isProduction()) {
      throw new Error("DATABASE_URL is required in production.");
    }
    return null;
  }

  if (!global.prismaGlobal) {
    try {
      // Lazily require Prisma to avoid loading it at module-import time
      // which can trigger initialization on routes that don't need DB.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { PrismaClient } = require("@prisma/client");
      global.prismaGlobal = new PrismaClient();
    } catch {
      return null;
    }
  }

  return global.prismaGlobal;
}
