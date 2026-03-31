import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    const supabase = await createSupabaseServerClient();
    const signIn = await supabase.auth.signInWithPassword({ email, password });

    // eslint-disable-next-line no-console
    console.log("api/test-signin signIn:", JSON.stringify(signIn));

    return NextResponse.json({ signIn });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("api/test-signin error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
