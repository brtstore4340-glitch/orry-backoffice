export const dynamic = "force-dynamic";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PageHeader } from "@/components/app-shell/page-header";
import { Workspace } from "@/components/app-shell/workspace";
import { DataTable } from "@/components/data-table/data-table";
import { requireRole, requireUser } from "@/lib/authorization";
import { getBankAccounts } from "@/lib/repository";
import { thaiCanonicalTerms } from "@/lib/thai-terminology";

export default async function BankAccountsPage() {
  const session = await auth();
  const user = requireUser(session);
  try {
    requireRole(user, ["ADMIN", "EXECUTIVE", "FINANCE"]);
  } catch {
    redirect("/dashboard");
  }

  const bankAccounts = await getBankAccounts();
  return (
    <>
      <PageHeader title="บัญชีธนาคาร" description={`บัญชีธนาคาร ช่องทางชำระเงิน และ${thaiCanonicalTerms.bankAccountMapping}`} eyebrow="Bank Accounts" actions={<Link href="/settings/bank-accounts/new" className="button">เพิ่มบัญชีธนาคาร</Link>} />
      <Workspace>
        <DataTable
          columns={["ธนาคาร", "ชื่อบัญชี", "เลขที่บัญชี", "สาขา", "สถานะ", "รายละเอียด"]}
          rows={bankAccounts.map((account) => [
            account.bankName,
            account.accountName,
            account.accountNumber,
            account.branch ?? "-",
            account.isPrimary ? "บัญชีหลัก" : "ใช้งาน",
            <Link key={account.id} href={`/settings/bank-accounts/${account.id}`} className="inline-link">เปิดดู</Link>,
          ])}
        />
      </Workspace>
    </>
  );
}
