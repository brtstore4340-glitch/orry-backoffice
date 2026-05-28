export const dynamic = "force-dynamic";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PageHeader } from "@/components/app-shell/page-header";
import { Workspace } from "@/components/app-shell/workspace";
import { DataTable } from "@/components/data-table/data-table";
import { requireRole, requireUser } from "@/lib/authorization";
import { listCompanyBranches } from "@/lib/repository";

export default async function CompanyBranchesPage() {
  const session = await auth();
  const user = requireUser(session);
  try {
    requireRole(user, ["ADMIN", "EXECUTIVE", "FINANCE"]);
  } catch {
    redirect("/dashboard");
  }

  const branches = await listCompanyBranches();
  return (
    <>
      <PageHeader title="สาขา" description="จัดการสาขาที่ใช้งานบนเอกสารภาษีและข้อมูลบริษัท" eyebrow="Company Information" actions={<Link href="/settings/company/branches/new" className="button">เพิ่มสาขา</Link>} />
      <Workspace>
        <DataTable
          columns={["ชื่อสาขา", "รหัสสาขา", "สถานะ", "หมายเหตุ", "จัดการ"]}
          rows={branches.map((branch) => [
            branch.branchName,
            branch.branchCode,
            branch.active ? "ใช้งาน" : "ปิดใช้งาน",
            branch.isHeadOffice ? "สาขาหลักของ ORRY" : "สาขาใช้งานบนเอกสาร",
            <Link key={branch.id} href={`/settings/company/branches/${branch.id}/edit`} className="inline-link">แก้ไข</Link>
          ])}
        />
      </Workspace>
    </>
  );
}
