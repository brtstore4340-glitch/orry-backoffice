import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const password = String(form.get("password") ?? "");

    const supabase = await createSupabaseServerClient();
    const signIn = await supabase.auth.signInWithPassword({ email, password });

    // Debug logs for server-side sign-in
    try {
      // eslint-disable-next-line no-console
      console.log('API /api/login signIn.error:', signIn.error ? String(signIn.error.message ?? signIn.error.name) : 'none');
      // eslint-disable-next-line no-console
      console.log('API /api/login hasSession:', Boolean(signIn.data?.session));
    } catch (e) {
      // ignore
    }

    if (signIn.error) {
      const reason = String(signIn.error.message ?? signIn.error.name ?? "unknown");
      return NextResponse.redirect(`/login?error=invalid&reason=${encodeURIComponent(reason)}`);
    }

    if (!signIn.data?.session) {
      return NextResponse.redirect(`/login?error=invalid&reason=${encodeURIComponent("no-session")}`);
    }

    return NextResponse.redirect(new URL("/dashboard", request.url));
  } catch (e) {
    return NextResponse.redirect(`/login?error=server`);
  }
}
