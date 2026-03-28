export const runtime = 'nodejs';
import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";

async function loginAction(formData: FormData) {
  "use server";
  await signIn("credentials", {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    redirectTo: "/dashboard"
  });
}

export default async function LoginPage({ searchParams }: { searchParams?: Promise<{ error?: string }> }) {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  const params = searchParams ? await searchParams : undefined;
  const showDemo = process.env.NODE_ENV !== "production";

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
            {showDemo ? (
              <article className="subtle-panel login-feature-card">
                <strong>Seeded access</strong>
                <p><span>Admin email</span> <code>admin@orry.local</code></p>
                <p><span>Password</span> <code>demo-admin</code></p>
              </article>
            ) : null}
          </div>
        </section>
        <section className="login-form">
          <div>
            <span className="eyebrow">Secure sign-in</span>
            <h2>Enter the command center</h2>
            <p>Signed ORRY sessions are backed by the ORRY user store for local and Supabase Postgres environments.</p>
            {params?.error ? <p className="security-note">Sign-in could not be completed. Check your credentials and try again.</p> : null}
          </div>
          <form action={loginAction} className="stack-form">
            <label>
              <span>Email</span>
              <input className="input" name="email" type="email" defaultValue={showDemo ? "admin@orry.local" : undefined} />
            </label>
            <label>
              <span>Password</span>
              <input className="input" name="password" type="password" defaultValue={showDemo ? "demo-admin" : undefined} />
            </label>
            <button className="button" type="submit">Enter workspace</button>
          </form>
        </section>
      </div>
    </main>
  );
}
