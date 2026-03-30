export const runtime = "nodejs";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function loginAction(formData: FormData) {
  "use server";
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: String(formData.get("password") ?? ""),
  });

  if (error) {
    redirect("/login?error=invalid");
  }

  redirect("/dashboard");
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; reset?: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  const params = searchParams ? await searchParams : undefined;

  return (
    <main className="login-page">
      <div className="login-shell chrome-panel">
        <section className="login-art">
          <span className="eyebrow">ORRY Serenity Kiss</span>
          <h1>Private business operations for premium beauty commerce.</h1>
          <p>Run proposals, orders, billing, collections, catalog control, and issuer settings from one dark enterprise workspace designed for calm executive visibility.</p>
          <div className="login-feature-grid">
            <article className="subtle-panel login-feature-card">
              <strong>Commercial visibility</strong>
              <p>Track draft-to-paid document flow, urgent approvals, and account readiness in one surface.</p>
            </article>
            <article className="subtle-panel login-feature-card">
              <strong>Supabase Auth</strong>
              <p>Sessions, recovery, and password updates are now mediated by Supabase Auth with ORRY approval gates enforced server-side.</p>
            </article>
          </div>
        </section>
        <section className="login-form">
          <div>
            <span className="eyebrow">Secure sign-in</span>
            <h2>Enter the command center</h2>
            <p>Signed ORRY sessions are backed by Supabase Auth and mapped to the ORRY user store for approval and role checks.</p>
            {params?.error ? <p className="security-note">Sign-in could not be completed. Check your credentials, approval status, and account availability.</p> : null}
            {params?.reset === "success" ? <p className="security-note success-note">Password changed. Sign in with your new password.</p> : null}
          </div>
          <form action={loginAction} className="stack-form">
            <label>
              <span>Email</span>
              <input className="input" name="email" type="email" autocomplete="email" />
            </label>
            <label>
              <span>Password</span>
              <input className="input" name="password" type="password" autocomplete="current-password" />
            </label>
            <button className="button" type="submit">Enter workspace</button>
          </form>
          <div className="auth-links-stack">
            <Link href="/register" className="inline-link">Register for access</Link>
            <Link href="/forgot-password" className="inline-link">Forgot password</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
