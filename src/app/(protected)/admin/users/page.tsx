export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PageHeader } from "@/components/app-shell/page-header";
import { Workspace } from "@/components/app-shell/workspace";
import { DataTable } from "@/components/data-table/data-table";
import { SimpleForm } from "@/components/forms/simple-form";
import { requireRole, requireUser } from "@/lib/authorization";
import { getPrisma } from "@/lib/db";
import { createManagedUserAction } from "@/app/(protected)/users/actions";
import { thaiRoleLabels, formatThaiStatusLabel } from "@/lib/orry-labels";

export default async function AdminUsersPage() {
  const session = await auth();
  const actor = requireUser(session);
  try {
    requireRole(actor, ["ADMIN"]);
  } catch {
    redirect("/dashboard");
  }

  const prisma = getPrisma() as any;
  const users = prisma ? await prisma.user.findMany({ include: { role: true }, orderBy: { createdAt: "desc" } }) : [];

  return (
    <>
      <PageHeader title="ผู้ใช้งาน" description="จัดการผู้ใช้งาน สิทธิ์ และสถานะอนุมัติการเข้าใช้งานระบบ" eyebrow="Identity & Access" />
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
          rows={users.map((user: any) => [
            user.name,
            user.email,
            thaiRoleLabels[user.role.code as keyof typeof thaiRoleLabels],
            formatThaiStatusLabel(user.approvalStatus),
            user.active ? "ใช้งาน" : "ไม่ใช้งาน",
          ])}
        />
      </Workspace>
    </>
  );
}
