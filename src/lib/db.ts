import { PrismaClient } from "@prisma/client";
import { getRuntimeEnv, isProduction } from "@/lib/env";

declare global {
  var prismaGlobal: PrismaClient | undefined;
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
    global.prismaGlobal = new PrismaClient();
  }

  return global.prismaGlobal;
}
