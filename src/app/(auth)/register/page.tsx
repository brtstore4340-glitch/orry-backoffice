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
      dateOfBirth: String(formData.get("dateOfBirth") ?? "")
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
  searchParams
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
      <div className="auth-stage">
        <div className="auth-stage-bar">
          <div className="auth-brand-lockup">
            <span className="auth-brand-mark">O</span>
            <div className="auth-brand-copy">
              <strong>ORRY Serenity Kiss</strong>
              <span>Request back-office access</span>
            </div>
          </div>
          <span className="topbar-chip">Approval workflow</span>
        </div>
        <div className="login-shell chrome-panel auth-shell">
        <section className="login-art">
          <div className="stack-list">
            <span className="eyebrow">ORRY Serenity Kiss</span>
            <h1>ขอสิทธิ์เข้าถึงหลังบ้าน</h1>
            <p>บัญชีใหม่จะถูกสร้างในสถานะรออนุมัติและต้องผ่านการตรวจสอบก่อนใช้งานจริง</p>
          </div>
          <div className="auth-highlight-row">
            <article className="auth-highlight-card subtle-panel">
              <span>Identity</span>
              <strong>ข้อมูลผู้ใช้งานจริง</strong>
              <p>แบบฟอร์มนี้ยังใช้ข้อมูลเดียวกับ workflow การอนุมัติผู้ใช้งานในระบบปัจจุบัน</p>
            </article>
            <article className="auth-highlight-card subtle-panel">
              <span>Delivery</span>
              <strong>Temporary password by email</strong>
              <p>การส่งข้อมูลยืนยันและรหัสผ่านชั่วคราวยังเป็นไปตามการตั้งค่าการส่งอีเมลเดิม</p>
            </article>
          </div>
          <div className="login-feature-grid">
            <article className="subtle-panel login-feature-card">
              <strong>อนุมัติจากผู้ดูแลระบบ</strong>
              <p>ระบบจะไม่เปิดสิทธิ์ใช้งานอัตโนมัติจนกว่าจะมีผู้อนุมัติ</p>
            </article>
            <article className="subtle-panel login-feature-card">
              <strong>ส่งรหัสผ่านชั่วคราว</strong>
              <p>รหัสผ่านเริ่มต้นและเหตุการณ์สำคัญจะถูกส่งผ่านอีเมลตามการตั้งค่าระบบ</p>
            </article>
          </div>
        </section>
        <section className="login-form">
          <div>
            <span className="eyebrow">คำขอสมัคร</span>
            <h2>กรอกข้อมูลผู้ใช้งาน</h2>
            <p>ข้อมูลต้องตรงกับบัตรพนักงานและข้อมูลติดต่อที่ใช้จริง</p>
            {search?.status === "submitted" ? <p className="security-note success-note">ส่งคำขอเรียบร้อยแล้ว กรุณารอการอนุมัติจากผู้ดูแลระบบ</p> : null}
            {search?.error === "email" ? <p className="security-note danger-note">ไม่สามารถส่งอีเมลได้ในขณะนี้ กรุณาลองใหม่ภายหลัง</p> : null}
            {search?.error === "failed" ? <p className="security-note danger-note">ไม่สามารถบันทึกคำขอได้</p> : null}
          </div>
          <form action={registerAction} className="stack-form form-grid two-column-form auth-form-panel">
            <label>
              <span>อีเมล</span>
              <input className="input" name="email" type="email" required />
            </label>
            <label>
              <span>รหัสพนักงาน</span>
              <input className="input" name="employeeId" type="text" required />
            </label>
            <label>
              <span>ชื่อ</span>
              <input className="input" name="firstName" type="text" required />
            </label>
            <label>
              <span>นามสกุล</span>
              <input className="input" name="lastName" type="text" required />
            </label>
            <label className="full-span">
              <span>วันเกิด</span>
              <input className="input" name="dateOfBirth" type="date" required />
            </label>
            <div className="full-span auth-links-row">
              <button className="button" type="submit">ส่งคำขอสมัคร</button>
              <Link href="/login" className="inline-link">กลับไปหน้าเข้าสู่ระบบ</Link>
            </div>
          </form>
        </section>
        </div>
      </div>
    </main>
  );
}
