export const dynamic = "force-dynamic";
import { PageHeader } from "@/components/app-shell/page-header";
import { SimpleForm } from "@/components/forms/simple-form";

export default function ChangePasswordPage() {
  return (
    <>
      <PageHeader title="เปลี่ยนรหัสผ่าน" description="อัปเดตรหัสผ่านเพื่อความปลอดภัยของบัญชีผู้ใช้งาน" eyebrow="Profile" />
      <SimpleForm title="ตั้งค่ารหัสผ่านใหม่" description="ระบบจะบังคับใช้นโยบายรหัสผ่านของ ORRY และบันทึกเหตุการณ์ความปลอดภัย">
        <form className="stack-form compact-form">
          <label><span>รหัสผ่านปัจจุบัน</span><input className="input" type="password" /></label>
          <label><span>รหัสผ่านใหม่</span><input className="input" type="password" /></label>
          <label><span>ยืนยันรหัสผ่านใหม่</span><input className="input" type="password" /></label>
          <button className="button" type="button">อัปเดตรหัสผ่าน</button>
        </form>
      </SimpleForm>
    </>
  );
}
