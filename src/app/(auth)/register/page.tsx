export const runtime = "nodejs";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isEmailTransportError, submitRegistration } from "@/lib/user-management";

async function registerAction(formData: FormData) {
  "use server";

  try {
    await submitRegistration({
      email: String(formData.get("email") ?? ""),
      firstName: String(formData.get("firstName") ?? ""),
      lastName: String(formData.get("lastName") ?? ""),
      employeeId: String(formData.get("employeeId") ?? ""),
      dateOfBirth: String(formData.get("dateOfBirth") ?? ""),
    });
    redirect("/register?status=submitted");
  } catch (error) {
    if (isEmailTransportError(error)) {
      redirect("/register?error=email");
    }
    redirect("/register?error=failed");
  }
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string; error?: string }>;
}) {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  const search = searchParams ? await searchParams : undefined;

  return (
    <main className="login-page">
      <div className="login-shell chrome-panel">
        <section className="login-art">
          <div className="stack-list">
            <span className="eyebrow">ORRY Serenity Kiss</span>
            <h1>Register for controlled back-office access.</h1>
            <p>New registrations stay pending until an administrator approves the account. Access never opens automatically.</p>
          </div>
          <div className="login-feature-grid">
            <article className="subtle-panel login-feature-card">
              <strong>Approval required</strong>
              <p>Pending, rejected, and inactive accounts are blocked server-side through ORRY and Supabase Auth.</p>
            </article>
            <article className="subtle-panel login-feature-card">
              <strong>Credential delivery</strong>
              <p>Temporary credentials are created server-side and delivered only through the configured mail transport.</p>
            </article>
          </div>
        </section>
        <section className="login-form">
          <div>
            <span className="eyebrow">Registration request</span>
            <h2>Create request</h2>
            <p>Enter your company identity details exactly as they should appear in ORRY.</p>
            {search?.status === "submitted" ? <p className="security-note success-note">Registration submitted. Please wait for administrator approval and check your email.</p> : null}
            {search?.error === "email" ? <p className="security-note danger-note">Registration could not be completed at this time. Please try again later or contact an administrator.</p> : null}
            {search?.error === "failed" ? <p className="security-note danger-note">Registration could not be completed.</p> : null}
          </div>
          <form action={registerAction} className="stack-form form-grid two-column-form">
            <label>
              <span>Email</span>
              <input className="input" name="email" type="email" required />
            </label>
            <label>
              <span>Employee ID</span>
              <input className="input" name="employeeId" type="text" required />
            </label>
            <label>
              <span>First Name</span>
              <input className="input" name="firstName" type="text" required />
            </label>
            <label>
              <span>Last Name</span>
              <input className="input" name="lastName" type="text" required />
            </label>
            <label className="full-span">
              <span>Date of Birth</span>
              <input className="input" name="dateOfBirth" type="date" required />
            </label>
            <div className="full-span auth-links-row">
              <button className="button" type="submit">Submit registration</button>
              <Link href="/login" className="inline-link">Back to sign in</Link>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
