export const runtime = "nodejs";

import Link from "next/link";
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

export default async function LoginPage({
  searchParams
}: {
  searchParams?: Promise<{ error?: string; reset?: string }>;
}) {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  const params = searchParams ? await searchParams : undefined;

  return (
    <main className="login-page">
      <div className="auth-stage">
        <div className="auth-stage-bar">
          <div className="auth-brand-lockup">
            <span className="auth-brand-mark">O</span>
            <div className="auth-brand-copy">
              <strong>ORRY Serenity Kiss</strong>
              <span>B2B back office access</span>
            </div>
          </div>
          <span className="topbar-chip">Approved accounts only</span>
        </div>
        <div className="login-shell compact-auth-shell chrome-panel auth-shell">
        <section className="login-art">
          <div className="stack-list">
            <span className="eyebrow">ORRY Serenity Kiss</span>
            <h1>เข้าสู่ระบบหลังบ้าน ORRY</h1>
            <p>ใช้บัญชีที่ได้รับอนุมัติแล้วเพื่อเข้าถึงข้อมูลบริษัท ผู้ติดต่อ สินค้า เอกสารทางบัญชี และแดชบอร์ดการควบคุมงานประจำวัน</p>
          </div>
          <div className="auth-highlight-row">
            <article className="auth-highlight-card subtle-panel">
              <span>Workspace</span>
              <strong>Sales, stock, and billing</strong>
              <p>ทุกหน้าหลักใช้ visual language เดียวกันเพื่อให้สลับงานต่อได้ทันทีหลังเข้าสู่ระบบ</p>
            </article>
            <article className="auth-highlight-card subtle-panel">
              <span>Access policy</span>
              <strong>Approval stays server-side</strong>
              <p>สถานะอนุมัติ การเปิดใช้งาน และสิทธิ์เข้าถึงยังถูกบังคับใช้ด้วย logic เดิมของระบบ</p>
            </article>
          </div>
          <div className="login-feature-grid">
            <article className="subtle-panel login-feature-card">
              <strong>สิทธิ์เข้าถึงแบบมีการอนุมัติ</strong>
              <p>บัญชีที่ยังรออนุมัติ ถูกระงับ หรือไม่เปิดใช้งานจะไม่สามารถเข้าสู่ระบบได้</p>
            </article>
            <article className="subtle-panel login-feature-card">
              <strong>ประวัติการใช้งาน</strong>
              <p>ระบบบันทึกเหตุการณ์สำคัญเพื่อรองรับการตรวจสอบและการดูแลด้านความปลอดภัย</p>
            </article>
          </div>
        </section>
        <section className="login-form">
          <div>
            <span className="eyebrow">เข้าสู่ระบบ</span>
            <h2>กรอกข้อมูลบัญชี</h2>
            <p>หากยังไม่มีสิทธิ์ใช้งาน ให้สมัครหรือรอการอนุมัติจากผู้ดูแลระบบ</p>
            {params?.error ? <p className="security-note">เข้าสู่ระบบไม่สำเร็จ ตรวจสอบอีเมล รหัสผ่าน และสถานะบัญชี</p> : null}
            {params?.reset === "success" ? <p className="security-note success-note">เปลี่ยนรหัสผ่านเรียบร้อยแล้ว กรุณาเข้าสู่ระบบอีกครั้ง</p> : null}
          </div>
          <form action={loginAction} className="stack-form auth-form-panel">
            <label>
              <span>อีเมล</span>
              <input className="input" name="email" type="email" autoComplete="email" placeholder="name@company.com" required />
            </label>
            <label>
              <span>รหัสผ่าน</span>
              <input className="input" name="password" type="password" autoComplete="current-password" placeholder="กรอกรหัสผ่านของคุณ" required />
            </label>
            <button className="button" type="submit">เข้าสู่ระบบ</button>
          </form>
          <div className="auth-links-stack">
            <Link href="/register" className="inline-link">ขอสิทธิ์ใช้งาน</Link>
            <Link href="/forgot-password" className="inline-link">ลืมรหัสผ่าน</Link>
          </div>
          <p className="inline-note">หากบัญชีของคุณยังไม่ผ่านการอนุมัติ ระบบจะยังไม่อนุญาตให้เข้าสู่ workspace จนกว่าผู้ดูแลจะยืนยันสิทธิ์</p>
        </section>
        </div>
      </div>
    </main>
  );
}
