import "server-only";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { getRuntimeEnv } from "@/lib/env";
import fs from "fs";

export async function createSupabaseServerClient() {
  const env = getRuntimeEnv();

  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY) {
    throw new Error("SUPABASE_CONFIG_UNAVAILABLE");
  }

  const cookieStore = await cookies();

  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options: CookieOptions }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot always mutate cookies; middleware refresh handles persistence.
          try {
            const logDir = './tmp';
            if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
            const msg = `[${new Date().toISOString()}] Failed to set cookies in createSupabaseServerClient setAll\n`;
            fs.appendFileSync(`${logDir}/supabase-cookie-errors.log`, msg);
          } catch (e) {
            // best-effort logging, ignore failures
          }
        }
      },
    },
  });
}
