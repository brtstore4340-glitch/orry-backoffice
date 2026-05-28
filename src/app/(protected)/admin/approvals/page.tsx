export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PageHeader } from "@/components/app-shell/page-header";
import { Workspace } from "@/components/app-shell/workspace";
import { DataTable } from "@/components/data-table/data-table";
import { requireRole, requireUser } from "@/lib/authorization";
import { getPrisma } from "@/lib/db";
import { reviewRegistrationAction } from "@/app/(protected)/users/actions";

export default async function ApprovalQueuePage() {
  const session = await auth();
  const actor = requireUser(session);
  try {
    requireRole(actor, ["ADMIN"]);
  } catch {
    redirect("/dashboard");
  }

  const prisma = getPrisma() as any;
  const users = prisma ? await prisma.user.findMany({ include: { role: true }, where: { approvalStatus: { in: ["PENDING", "REJECTED"] } }, orderBy: { createdAt: "desc" } }) : [];

  return (
    <>
      <PageHeader title="อนุมัติการใช้งาน" description="คิวอนุมัติ เปิดใช้งาน หรือปฏิเสธผู้ใช้งานใหม่ของ ORRY" eyebrow="Identity & Access" />
      <Workspace>
        <DataTable
          columns={["ชื่อ", "อีเมล", "บทบาท", "สถานะ", "สร้างเมื่อ", "ดำเนินการ"]}
          rows={users.map((user: any) => [
            user.name,
            user.email,
            user.role?.name ?? user.role?.code ?? "-",
            user.approvalStatus,
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
      </Workspace>
    </>
  );
}
