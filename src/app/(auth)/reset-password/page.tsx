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
  searchParams
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const search = searchParams ? await searchParams : undefined;
  const state = await getResetSessionStatus();

  return (
    <main className="login-page">
      <div className="auth-stage">
        <div className="auth-stage-bar">
          <div className="auth-brand-lockup">
            <span className="auth-brand-mark">O</span>
            <div className="auth-brand-copy">
              <strong>ORRY Serenity Kiss</strong>
              <span>Secure password reset</span>
            </div>
          </div>
          <span className="topbar-chip">Session-bound reset</span>
        </div>
        <div className="login-shell chrome-panel compact-auth-shell auth-shell">
        <section className="login-art">
          <div className="stack-list">
            <span className="eyebrow">การกู้คืนบัญชี</span>
            <h1>ตั้งรหัสผ่านใหม่อย่างปลอดภัย</h1>
            <p>การกู้คืนจะเสร็จสมบูรณ์เฉพาะเมื่อเซสชันรีเซ็ตยังใช้งานได้และบัญชีของคุณยังได้รับอนุมัติ</p>
          </div>
          <div className="auth-highlight-row single-column">
            <article className="auth-highlight-card subtle-panel">
              <span>Session status</span>
              <strong>Approval and activity still enforced</strong>
              <p>การตั้งรหัสผ่านใหม่จะสำเร็จได้เฉพาะกับเซสชันที่ยังใช้งานได้และบัญชีที่ยังผ่านเงื่อนไขเดิมของระบบ</p>
            </article>
          </div>
        </section>
        <section className="login-form">
          <div>
            <span className="eyebrow">รีเซ็ตรหัสผ่าน</span>
            <h2>กำหนดรหัสผ่านใหม่</h2>
            <p>{state.message}</p>
            {search?.error === "policy" ? <p className="security-note danger-note">รหัสผ่านและการยืนยันไม่ตรงกัน หรือไม่ผ่านนโยบายรหัสผ่าน</p> : null}
            {search?.error === "invalid" ? <p className="security-note danger-note">ลิงก์รีเซ็ตนี้ไม่ถูกต้องหรือใช้งานไม่ได้แล้ว</p> : null}
          </div>
          {state.valid ? (
            <form action={resetPasswordAction} className="stack-form auth-form-panel">
              <label>
                <span>รหัสผ่านใหม่</span>
                <input className="input" name="password" type="password" required />
              </label>
              <label>
                <span>ยืนยันรหัสผ่าน</span>
                <input className="input" name="confirmPassword" type="password" required />
              </label>
              <div className="auth-links-row">
                <button className="button" type="submit">บันทึกรหัสผ่านใหม่</button>
                <Link href="/login" className="inline-link">กลับไปหน้าเข้าสู่ระบบ</Link>
              </div>
            </form>
          ) : (
            <div className="stack-form">
              <Link href="/forgot-password" className="inline-link">ขอลิงก์รีเซ็ตใหม่</Link>
            </div>
          )}
        </section>
        </div>
      </div>
    </main>
  );
}
