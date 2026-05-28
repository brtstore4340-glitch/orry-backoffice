export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PageHeader } from "@/components/app-shell/page-header";
import { Workspace } from "@/components/app-shell/workspace";
import { requireRole, requireUser } from "@/lib/authorization";
import { getCompanyTaxProfile } from "@/lib/repository";

export default async function CompanyTaxPage() {
  const session = await auth();
  const user = requireUser(session);
  try {
    requireRole(user, ["ADMIN", "EXECUTIVE", "FINANCE"]);
  } catch {
    redirect("/dashboard");
  }

  const company = await getCompanyTaxProfile();
  return (
    <>
      <PageHeader title="ข้อมูลภาษี" description="ข้อมูลจด VAT เลขภาษี และการใช้งานบนใบกำกับภาษีและหัก ณ ที่จ่าย" eyebrow="Company Information" />
      <Workspace>
        <dl className="definition-list settings-grid">
          <div><dt>เลขประจำตัวผู้เสียภาษี</dt><dd>{company.taxId ?? "-"}</dd></div>
          <div><dt>สาขา</dt><dd>{company.branchName ?? "-"}</dd></div>
          <div><dt>รหัสสาขา</dt><dd>{company.branchCode ?? "-"}</dd></div>
          <div><dt>สถานะ VAT</dt><dd>{company.vatRegistered ? "จดทะเบียนภาษีมูลค่าเพิ่ม" : "ยังไม่จดทะเบียน"}</dd></div>
        </dl>
      </Workspace>
    </>
  );
}
