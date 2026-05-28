export const dynamic = "force-dynamic";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PageHeader } from "@/components/app-shell/page-header";
import { DetailPanel } from "@/components/detail-panel/detail-panel";
import { Workspace } from "@/components/app-shell/workspace";
import { requireRole, requireUser } from "@/lib/authorization";
import { getCompanyProfile } from "@/lib/repository";

export default async function CompanySettingsPage() {
  const session = await auth();
  const user = requireUser(session);
  try {
    requireRole(user, ["ADMIN", "EXECUTIVE", "FINANCE"]);
  } catch {
    redirect("/dashboard");
  }

  const company = await getCompanyProfile();
  return (
    <>
      <PageHeader title="ข้อมูลบริษัท" description="ข้อมูลผู้ออกเอกสาร ข้อมูลจดทะเบียน และช่องทางติดต่อหลักของ ORRY" eyebrow="Company Information" actions={<div className="action-cluster"><Link href="/settings/company/tax" className="button ghost-button compact-button">ข้อมูลภาษี</Link><Link href="/settings/company/branches" className="button ghost-button compact-button">สาขา</Link></div>} />
      <div className="content-grid two-up">
        <DetailPanel title="ข้อมูลนิติบุคคล" subtitle="ใช้พิมพ์บนเอกสารทุกประเภท">
          <dl className="definition-list settings-grid">
            <div><dt>ชื่อแสดงผล</dt><dd>{company.displayName}</dd></div>
            <div><dt>ชื่อจดทะเบียน</dt><dd>{company.legalName}</dd></div>
            <div><dt>เลขประจำตัวผู้เสียภาษี</dt><dd>{company.taxId ?? "-"}</dd></div>
            <div><dt>สาขาหลัก</dt><dd>{company.defaultBranchName ?? "-"} {company.defaultBranchCode ? `(${company.defaultBranchCode})` : ""}</dd></div>
            <div><dt>อีเมล</dt><dd>{company.email ?? "-"}</dd></div>
            <div><dt>เว็บไซต์</dt><dd>{company.website ?? "-"}</dd></div>
            <div><dt>ที่อยู่</dt><dd>{company.address ?? "-"}</dd></div>
          </dl>
        </DetailPanel>
        <Workspace>
          <div className="section-heading">
            <div>
              <span className="eyebrow">Bank Accounts</span>
              <h2>บัญชีที่ใช้งาน</h2>
              <p>บัญชีธนาคารที่พร้อมใช้สำหรับรับชำระเงินและพิมพ์บนเอกสาร</p>
            </div>
          </div>
          <div className="stack-list">
            {company.bankAccounts.map((account) => (
              <article key={account.accountNumber} className="subtle-panel list-row emphasis-row">
                <div>
                  <strong>{account.bankName}</strong>
                  <p>{account.accountName} / {account.accountNumber}</p>
                </div>
              </article>
            ))}
          </div>
        </Workspace>
      </div>
    </>
  );
}
