import { NextResponse } from "next/server";
import { getRuntimeEnv } from "@/lib/env";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    const env = getRuntimeEnv();

    if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "missing-service-role-or-url" }, { status: 500 });
    }

    const adminUrl = `${env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/+$/,'')}/auth/v1/admin/users`;

    const res = await fetch(adminUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      },
      body: JSON.stringify({ email, password, email_confirm: true }),
    });

    const data = await res.json();

    // eslint-disable-next-line no-console
    console.log("api/admin-create-user result:", JSON.stringify({ status: res.status, data }));

    if (!res.ok) {
      return NextResponse.json({ error: data }, { status: res.status });
    }

    return NextResponse.json({ ok: true, data });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("api/admin-create-user error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
