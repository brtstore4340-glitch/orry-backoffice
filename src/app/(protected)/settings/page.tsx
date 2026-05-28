export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PageHeader } from "@/components/app-shell/page-header";
import { Workspace } from "@/components/app-shell/workspace";
import { DataTable } from "@/components/data-table/data-table";
import { requireRole, requireUser } from "@/lib/authorization";
import { getCompanyProfile, getCompanyTaxProfile, getBankAccounts } from "@/lib/repository";

export default async function SettingsPage() {
  const session = await auth();
  const user = requireUser(session);
  try {
    requireRole(user, ["ADMIN", "EXECUTIVE", "FINANCE"]);
  } catch {
    redirect("/dashboard");
  }

  const [company, taxProfile, bankAccounts] = await Promise.all([
    getCompanyProfile(),
    getCompanyTaxProfile(),
    getBankAccounts()
  ]);

  return (
    <>
      <PageHeader title="ตั้งค่าระบบ" description="จัดการข้อมูลบริษัท ภาษี และบัญชีธนาคารจากศูนย์กลางเดียว" />
      <div className="content-grid two-up">
        <Workspace>
          <div className="section-heading">
            <div>
              <span className="eyebrow">ข้อมูลหลัก</span>
              <h2>ข้อมูลบริษัท</h2>
              <p>ตรวจสอบและปรับข้อมูลบริษัทที่ใช้ในเอกสาร</p>
            </div>
          </div>
          <dl className="definition-list settings-grid">
            <div><dt>ชื่อที่แสดง</dt><dd>{company.displayName}</dd></div>
            <div><dt>ชื่อทางกฎหมาย</dt><dd>{company.legalName}</dd></div>
            <div><dt>เลขผู้เสียภาษี</dt><dd>{company.taxId ?? "-"}</dd></div>
            <div><dt>สาขา</dt><dd>{company.defaultBranchName ?? "-"}</dd></div>
          </dl>
          <div className="auth-links-stack">
            <Link href="/settings/company" className="inline-link">แก้ไขข้อมูลบริษัท</Link>
            <Link href="/settings/company/tax" className="inline-link">ตั้งค่าภาษี</Link>
            <Link href="/settings/company/branches" className="inline-link">ดูสาขา</Link>
          </div>
        </Workspace>
        <Workspace>
          <div className="section-heading">
            <div>
              <span className="eyebrow">ภาษี</span>
              <h2>สถานะภาษี</h2>
              <p>ค่าที่ใช้ในใบกำกับภาษีและภาษีหัก ณ ที่จ่าย</p>
            </div>
          </div>
          <dl className="definition-list settings-grid">
            <div><dt>VAT</dt><dd>{taxProfile.vatRegistered ? "จดทะเบียนแล้ว" : "ยังไม่จดทะเบียน"}</dd></div>
            <div><dt>หัก ณ ที่จ่าย</dt><dd>{taxProfile.withholdingEnabled ? "เปิดใช้งาน" : "ปิดใช้งาน"}</dd></div>
            <div><dt>สรรพากร</dt><dd>{taxProfile.taxOffice ?? "-"}</dd></div>
            <div><dt>รหัสรายได้</dt><dd>{taxProfile.revenueCode ?? "-"}</dd></div>
          </dl>
          <div className="auth-links-stack">
            <Link href="/settings/company/tax" className="inline-link">แก้ไขข้อมูลภาษี</Link>
            <Link href="/settings/bank-accounts" className="inline-link">ไปหน้าบัญชีธนาคาร</Link>
          </div>
        </Workspace>
      </div>
      <Workspace>
        <div className="section-heading">
          <div>
            <span className="eyebrow">ช่องทางรับชำระ</span>
            <h2>บัญชีธนาคารหลัก</h2>
            <p>บัญชีที่ใช้กับการรับชำระและเอกสารการเงิน</p>
          </div>
          <div className="section-meta-chip">{bankAccounts.length} บัญชี</div>
        </div>
        <DataTable
          columns={["ธนาคาร", "ชื่อบัญชี", "เลขที่บัญชี", "สาขา", "หลัก"]}
          rows={bankAccounts.map((account) => [
            account.bankName,
            account.accountName,
            account.accountNumber,
            account.branch ?? "-",
            account.isPrimary ? "ใช่" : "ไม่ใช่"
          ])}
        />
      </Workspace>
    </>
  );
}
