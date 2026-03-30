export const runtime = "nodejs";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { requestPasswordReset } from "@/lib/user-management";

async function forgotPasswordAction(formData: FormData) {
  "use server";
  await requestPasswordReset(String(formData.get("email") ?? ""));
  redirect("/forgot-password?status=requested");
}

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string }>;
}) {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  const search = searchParams ? await searchParams : undefined;

  return (
    <main className="login-page">
      <div className="login-shell chrome-panel compact-auth-shell">
        <section className="login-art">
          <div className="stack-list">
            <span className="eyebrow">Recovery</span>
            <h1>Reset access without revealing account state.</h1>
            <p>Reset requests are accepted generically. ORRY only issues recovery links for approved active users.</p>
          </div>
        </section>
        <section className="login-form">
          <div>
            <span className="eyebrow">Forgot password</span>
            <h2>Request reset link</h2>
            <p>Enter your email and, if the request can be completed, you will receive reset instructions.</p>
            {search?.status === "requested" ? <p className="security-note success-note">If the request can be completed, reset instructions will be sent to your email.</p> : null}
          </div>
          <form action={forgotPasswordAction} className="stack-form">
            <label>
              <span>Email</span>
              <input className="input" name="email" type="email" required />
            </label>
            <div className="auth-links-row">
              <button className="button" type="submit">Request reset</button>
              <Link href="/login" className="inline-link">Back to sign in</Link>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
