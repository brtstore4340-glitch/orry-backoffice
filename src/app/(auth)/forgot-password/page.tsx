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
  searchParams
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
      <div className="auth-stage">
        <div className="auth-stage-bar">
          <div className="auth-brand-lockup">
            <span className="auth-brand-mark">O</span>
            <div className="auth-brand-copy">
              <strong>ORRY Serenity Kiss</strong>
              <span>Protected recovery flow</span>
            </div>
          </div>
          <span className="topbar-chip">Generic response policy</span>
        </div>
        <div className="login-shell chrome-panel compact-auth-shell auth-shell">
        <section className="login-art">
          <div className="stack-list">
            <span className="eyebrow">การกู้คืนบัญชี</span>
            <h1>ขอรีเซ็ตรหัสผ่านอย่างปลอดภัย</h1>
            <p>ระบบจะไม่เปิดเผยว่ามีบัญชีอยู่หรือไม่ และจะส่งลิงก์เฉพาะกับบัญชีที่มีสิทธิ์ใช้งานจริงเท่านั้น</p>
          </div>
          <div className="auth-highlight-row single-column">
            <article className="auth-highlight-card subtle-panel">
              <span>Recovery rule</span>
              <strong>No account disclosure</strong>
              <p>ข้อความตอบกลับยังคงเป็นแบบ generic เพื่อไม่เปิดเผยว่ามีบัญชีนี้อยู่ในระบบหรือไม่</p>
            </article>
          </div>
        </section>
        <section className="login-form">
          <div>
            <span className="eyebrow">ลืมรหัสผ่าน</span>
            <h2>ขอลิงก์รีเซ็ต</h2>
            <p>กรอกอีเมลของคุณ หากระบบดำเนินการได้จะส่งคำแนะนำการรีเซ็ตไปยังอีเมลนั้น</p>
            {search?.status === "requested" ? <p className="security-note success-note">หากอีเมลนี้ใช้งานได้ ระบบจะส่งคำแนะนำการรีเซ็ตไปให้</p> : null}
          </div>
          <form action={forgotPasswordAction} className="stack-form auth-form-panel">
            <label>
              <span>อีเมล</span>
              <input className="input" name="email" type="email" required />
            </label>
            <div className="auth-links-row">
              <button className="button" type="submit">ขอลิงก์รีเซ็ต</button>
              <Link href="/login" className="inline-link">กลับไปหน้าเข้าสู่ระบบ</Link>
            </div>
          </form>
        </section>
        </div>
      </div>
    </main>
  );
}
