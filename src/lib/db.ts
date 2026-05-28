import { getRuntimeEnv, isProduction } from "@/lib/env";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

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
      const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
      global.prismaGlobal = new PrismaClient({ adapter });
    } catch {
      return null;
    }
  }

  return global.prismaGlobal;
}
