export const dynamic = "force-dynamic";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PageHeader } from "@/components/app-shell/page-header";
import { SimpleForm } from "@/components/forms/simple-form";
import { requireRole, requireUser } from "@/lib/authorization";
import { recordSecurityEvent } from "@/lib/audit";
import { createBankAccount, getCompanyProfile } from "@/lib/repository";

async function createBankAccountAction(formData: FormData) {
  "use server";

  const session = await auth();
  const user = requireUser(session);
  try {
    requireRole(user, ["ADMIN", "EXECUTIVE", "FINANCE"]);
  } catch {
    redirect("/dashboard");
  }

  const company = await getCompanyProfile();
  const bankAccount = await createBankAccount({
    companyProfileId: company.id,
    bankName: String(formData.get("bankName") ?? "").trim(),
    accountName: String(formData.get("accountName") ?? "").trim(),
    accountNumber: String(formData.get("accountNumber") ?? "").trim(),
    branch: String(formData.get("branch") ?? "").trim() || undefined
  });

  await recordSecurityEvent({
    actorId: user.id,
    action: "bank_account.created",
    success: true,
    targetType: "BankAccount",
    targetId: bankAccount?.id,
    detail: "Bank account created."
  });

  revalidatePath("/settings/bank-accounts");
  if (bankAccount?.id) {
    redirect(`/settings/bank-accounts/${bankAccount.id}`);
  }
  redirect("/settings/bank-accounts");
}

export default async function NewBankAccountPage() {
  const session = await auth();
  const user = requireUser(session);
  try {
    requireRole(user, ["ADMIN", "EXECUTIVE", "FINANCE"]);
  } catch {
    redirect("/dashboard");
  }

  return (
    <>
      <PageHeader title="เพิ่มบัญชีธนาคาร" description="สร้างบัญชีธนาคารหรือช่องทางชำระเงินใหม่สำหรับ ORRY" eyebrow="Bank Accounts" />
      <SimpleForm title="ข้อมูลบัญชี" description="เชื่อมกับการรับชำระเงิน การจ่ายเงิน และการพิมพ์เอกสาร">
        <form action={createBankAccountAction} className="stack-form compact-form">
          <label><span>ธนาคาร</span><input className="input" name="bankName" placeholder="ธนาคารกสิกรไทย" required /></label>
          <label><span>ชื่อบัญชี</span><input className="input" name="accountName" placeholder="บริษัท ออร์รี่ จำกัด" required /></label>
          <label><span>เลขที่บัญชี</span><input className="input" name="accountNumber" placeholder="123-4-56789-0" required /></label>
          <label><span>สาขา</span><input className="input" name="branch" placeholder="สีลม" /></label>
          <button className="button" type="submit">บันทึกบัญชีธนาคาร</button>
        </form>
      </SimpleForm>
    </>
  );
}
