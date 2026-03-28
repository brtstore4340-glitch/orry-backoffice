export const runtime = 'nodejs';
import { signIn } from "@/auth";

async function loginAction(formData: FormData) {
  "use server";
  await signIn("credentials", {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    redirectTo: "/dashboard"
  });
}

export default function LoginPage() {
  return (
    <main className="login-page">
      <div className="login-shell chrome-panel">
        <section className="login-art">
          <span className="eyebrow">ORRY premium back office</span>
          <h1>Commercial control, fulfilment visibility, and collection flow in one operator deck.</h1>
          <p>Use the seeded access to inspect proposals, orders, billing, receipts, accounts, catalog, and settings.</p>
          <ul className="bullet-stack">
            <li>Admin email: <strong>admin@orry.local</strong></li>
            <li>Password: <strong>demo-admin</strong></li>
          </ul>
        </section>
        <section className="login-form">
          <div>
            <span className="eyebrow">Secure sign-in</span>
            <h2>Enter ORRY Business Deck</h2>
            <p>Auth.js credentials are backed by the ORRY user store for local and Supabase Postgres environments.</p>
          </div>
          <form action={loginAction} className="stack-form">
            <label>
              <span>Email</span>
              <input className="input" name="email" type="email" defaultValue="admin@orry.local" />
            </label>
            <label>
              <span>Password</span>
              <input className="input" name="password" type="password" defaultValue="demo-admin" />
            </label>
            <button className="button" type="submit">Enter workspace</button>
          </form>
        </section>
      </div>
    </main>
  );
}