import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    const supabase = await createSupabaseServerClient();
    const signUp = await supabase.auth.signUp({ email, password });

    // eslint-disable-next-line no-console
    console.log("api/test-signup signUp:", JSON.stringify(signUp));

    return NextResponse.json({ signUp });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("api/test-signup error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
