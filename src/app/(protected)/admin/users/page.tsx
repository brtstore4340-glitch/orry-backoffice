export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PageHeader } from "@/components/app-shell/page-header";
import { Workspace } from "@/components/app-shell/workspace";
import { DataTable } from "@/components/data-table/data-table";
import { SimpleForm } from "@/components/forms/simple-form";
import { requireRole, requireUser } from "@/lib/authorization";
import { createManagedUserAction } from "@/app/(protected)/users/actions";
import { thaiRoleLabels, formatThaiStatusLabel } from "@/lib/orry-labels";
import { listManagedUsers } from "@/lib/user-management";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string; error?: string }>;
}) {
  const search = searchParams ? await searchParams : undefined;
  const session = await auth();
  const actor = requireUser(session);
  try {
    requireRole(actor, ["ADMIN"]);
  } catch {
    redirect("/dashboard");
  }

  const users = await listManagedUsers();

  return (
    <>
      <PageHeader title="ผู้ใช้งาน" description="จัดการผู้ใช้งาน สิทธิ์ และสถานะอนุมัติการเข้าใช้งานระบบ" eyebrow="Identity & Access" />
      {search?.status === "created" ? (
        <Workspace className="feedback-banner feedback-banner-success" aria-live="polite">
          <strong className="feedback-banner-title">สร้างผู้ใช้งานสำเร็จ</strong>
          <p>ระบบได้สร้างบัญชีใหม่และพยายามส่งรหัสผ่านชั่วคราวตามขั้นตอนที่กำหนดแล้ว</p>
        </Workspace>
      ) : null}
      {search?.error === "email" ? (
        <Workspace className="feedback-banner feedback-banner-danger" role="alert">
          <strong className="feedback-banner-title">ส่งอีเมลรหัสผ่านชั่วคราวไม่สำเร็จ</strong>
          <p>การสร้างผู้ใช้งานถูกย้อนกลับเพื่อป้องกันบัญชีค้าง โปรดตรวจสอบการตั้งค่าอีเมลแล้วลองใหม่</p>
        </Workspace>
      ) : null}
      {search?.error === "create" ? (
        <Workspace className="feedback-banner feedback-banner-danger" role="alert">
          <strong className="feedback-banner-title">สร้างผู้ใช้งานไม่สำเร็จ</strong>
          <p>คำขอนี้ยังไม่ถูกบันทึก โปรดตรวจสอบข้อมูลที่กรอกและสภาพแวดล้อมของระบบก่อนลองอีกครั้ง</p>
        </Workspace>
      ) : null}
      <SimpleForm title="สร้างผู้ใช้งาน" description="สร้างผู้ใช้งานที่ได้รับอนุมัติพร้อมส่งรหัสผ่านชั่วคราว">
        <form action={createManagedUserAction} className="stack-form form-grid two-column-form">
          <label><span>อีเมล</span><input className="input" name="email" type="email" required /></label>
          <label><span>รหัสพนักงาน</span><input className="input" name="employeeId" required /></label>
          <label><span>ชื่อ</span><input className="input" name="firstName" required /></label>
          <label><span>นามสกุล</span><input className="input" name="lastName" required /></label>
          <label className="full-span"><span>วันเกิด</span><input className="input" name="dateOfBirth" type="date" required /></label>
          <div className="full-span"><button className="button" type="submit">สร้างผู้ใช้งาน</button></div>
        </form>
      </SimpleForm>
      <Workspace>
        <DataTable
          columns={["ชื่อ", "อีเมล", "บทบาท", "สถานะอนุมัติ", "การใช้งาน"]}
          rows={users.map((user) => [
            user.name,
            user.email,
            thaiRoleLabels[user.role?.code ?? "SALES"],
            formatThaiStatusLabel(user.approvalStatus),
            user.active ? "ใช้งาน" : "ไม่ใช้งาน",
          ])}
        />
      </Workspace>
    </>
  );
}
