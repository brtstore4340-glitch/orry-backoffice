export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PageHeader } from "@/components/app-shell/page-header";
import { DetailPanel } from "@/components/detail-panel/detail-panel";
import { requireRole, requireUser } from "@/lib/authorization";
import { getBankAccountById } from "@/lib/repository";

export default async function BankAccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = requireUser(session);
  try {
    requireRole(user, ["ADMIN", "EXECUTIVE", "FINANCE"]);
  } catch {
    redirect("/dashboard");
  }

  const { id } = await params;
  const bankAccount = await getBankAccountById(id);

  if (!bankAccount) notFound();

  return (
    <>
      <PageHeader title={bankAccount.bankName} description="รายละเอียดบัญชีธนาคารและช่องทางชำระเงิน" eyebrow="Bank Accounts" actions={<Link href={`/settings/bank-accounts/${bankAccount.id}/edit`} className="button">แก้ไข</Link>} />
      <DetailPanel title="รายละเอียดบัญชี" subtitle="พร้อมใช้งานบนใบกำกับภาษี ใบวางบิล/ใบแจ้งหนี้ และการรับชำระเงิน">
        <dl className="definition-list settings-grid">
          <div><dt>ธนาคาร</dt><dd>{bankAccount.bankName}</dd></div>
          <div><dt>ชื่อบัญชี</dt><dd>{bankAccount.accountName}</dd></div>
          <div><dt>เลขที่บัญชี</dt><dd>{bankAccount.accountNumber}</dd></div>
          <div><dt>สาขา</dt><dd>{bankAccount.branch ?? "-"}</dd></div>
          <div><dt>สถานะ</dt><dd>{bankAccount.isPrimary ? "บัญชีหลัก" : "ใช้งาน"}</dd></div>
        </dl>
      </DetailPanel>
    </>
  );
}
