import { NextResponse } from "next/server";
import { getRuntimeEnv, isPlaceholder } from "@/lib/env";

function mask(v?: string) {
  if (!v) return null;
  if (v.length <= 8) return v.replace(/./g, "*");
  return v.slice(0, 4) + "…" + v.slice(-4);
}

export async function GET() {
  try {
    const env = getRuntimeEnv();

    const keys = [
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
      "DATABASE_URL",
    ];

    const report: Record<string, { present: boolean; placeholder: boolean; value: string | null }> = {};

    for (const k of keys) {
      // @ts-ignore
      const v: string | undefined = env[k as keyof typeof env];
      report[k] = {
        present: !!v,
        placeholder: isPlaceholder(v),
        value: mask(v),
      };
    }

    return NextResponse.json({ ok: true, report });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("env-check error:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
