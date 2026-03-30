export const runtime = "nodejs";
import Link from "next/link";
import { redirect } from "next/navigation";
import { completePasswordReset, getResetSessionStatus } from "@/lib/user-management";

async function resetPasswordAction(formData: FormData) {
  "use server";

  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!password || password !== confirmPassword) {
    redirect("/reset-password?error=policy");
  }

  try {
    await completePasswordReset({ password });
    redirect("/login?reset=success");
  } catch (error) {
    const code = error instanceof Error ? error.message : "RESET_SESSION_INVALID";
    if (code === "PASSWORD_POLICY") {
      redirect("/reset-password?error=policy");
    }
    redirect("/reset-password?error=invalid");
  }
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const search = searchParams ? await searchParams : undefined;
  const state = await getResetSessionStatus();

  return (
    <main className="login-page">
      <div className="login-shell chrome-panel compact-auth-shell">
        <section className="login-art">
          <div className="stack-list">
            <span className="eyebrow">Recovery</span>
            <h1>Set a new password securely.</h1>
            <p>Recovery only completes when the Supabase recovery session is valid and the linked account is approved and active.</p>
          </div>
        </section>
        <section className="login-form">
          <div>
            <span className="eyebrow">Reset password</span>
            <h2>Choose a new password</h2>
            <p>{state.message}</p>
            {search?.error === "policy" ? <p className="security-note danger-note">Password confirmation failed or the password does not meet policy.</p> : null}
            {search?.error === "invalid" ? <p className="security-note danger-note">This reset link is invalid or can no longer be used.</p> : null}
          </div>
          {state.valid ? (
            <form action={resetPasswordAction} className="stack-form">
              <label>
                <span>New Password</span>
                <input className="input" name="password" type="password" required />
              </label>
              <label>
                <span>Confirm Password</span>
                <input className="input" name="confirmPassword" type="password" required />
              </label>
              <div className="auth-links-row">
                <button className="button" type="submit">Save new password</button>
                <Link href="/login" className="inline-link">Back to sign in</Link>
              </div>
            </form>
          ) : (
            <div className="stack-form">
              <Link href="/forgot-password" className="inline-link">Request a new reset link</Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
