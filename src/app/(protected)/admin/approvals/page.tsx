export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PageHeader } from "@/components/app-shell/page-header";
import { Workspace } from "@/components/app-shell/workspace";
import { DataTable } from "@/components/data-table/data-table";
import { requireRole, requireUser } from "@/lib/authorization";
import { reviewRegistrationAction } from "@/app/(protected)/users/actions";
import { formatThaiStatusLabel } from "@/lib/orry-labels";
import { listPendingRegistrations } from "@/lib/user-management";

export default async function ApprovalQueuePage({
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

  const users = await listPendingRegistrations();

  return (
    <>
      <PageHeader title="อนุมัติการใช้งาน" description="คิวอนุมัติ เปิดใช้งาน หรือปฏิเสธผู้ใช้งานใหม่ของ ORRY" eyebrow="Identity & Access" />
      {search?.status === "reviewed" ? (
        <Workspace className="feedback-banner feedback-banner-success" aria-live="polite">
          <strong className="feedback-banner-title">บันทึกผลการอนุมัติแล้ว</strong>
          <p>ระบบได้อัปเดตสถานะคำขอและซิงก์ข้อมูลสิทธิ์ตามผลการอนุมัติเรียบร้อยแล้ว</p>
        </Workspace>
      ) : null}
      {search?.error === "review" ? (
        <Workspace className="feedback-banner feedback-banner-danger" role="alert">
          <strong className="feedback-banner-title">บันทึกผลการอนุมัติไม่สำเร็จ</strong>
          <p>คำขอยังไม่ถูกเปลี่ยนสถานะ โปรดตรวจสอบว่าเป็นคำขอที่ยังรออนุมัติและลองอีกครั้ง</p>
        </Workspace>
      ) : null}
      <Workspace>
        {users.length === 0 ? (
          <p className="empty-state">ไม่มีคำขอที่รออนุมัติในตอนนี้</p>
        ) : (
          <DataTable
            columns={["ชื่อ", "อีเมล", "รหัสพนักงาน", "สถานะ", "สร้างเมื่อ", "ดำเนินการ"]}
            rows={users.map((user) => [
              `${user.firstName} ${user.lastName}`.trim(),
              user.email,
              user.employeeId,
              formatThaiStatusLabel(user.approvalStatus),
              new Date(user.createdAt).toLocaleDateString("th-TH"),
              <div key={user.id} className="action-cluster">
                <form action={reviewRegistrationAction}>
                  <input type="hidden" name="userId" value={user.id} />
                  <input type="hidden" name="decision" value="approve" />
                  <button className="button compact-button" type="submit">อนุมัติ</button>
                </form>
                <form action={reviewRegistrationAction}>
                  <input type="hidden" name="userId" value={user.id} />
                  <input type="hidden" name="decision" value="reject" />
                  <button className="button ghost-button compact-button" type="submit">ปฏิเสธ</button>
                </form>
              </div>
            ])}
          />
        )}
      </Workspace>
    </>
  );
}
