export const dynamic = "force-dynamic";

import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { PageHeader } from "@/components/app-shell/page-header";
import { SimpleForm } from "@/components/forms/simple-form";
import { requireRole, requireUser } from "@/lib/authorization";
import { recordSecurityEvent } from "@/lib/audit";
import { getBankAccountById, updateBankAccount } from "@/lib/repository";

async function updateBankAccountAction(formData: FormData) {
  "use server";

  const session = await auth();
  const user = requireUser(session);
  try {
    requireRole(user, ["ADMIN", "EXECUTIVE", "FINANCE"]);
  } catch {
    redirect("/dashboard");
  }

  const id = String(formData.get("id") ?? "");
  const bankAccount = await updateBankAccount({
    id,
    bankName: String(formData.get("bankName") ?? "").trim(),
    accountName: String(formData.get("accountName") ?? "").trim(),
    accountNumber: String(formData.get("accountNumber") ?? "").trim(),
    branch: String(formData.get("branch") ?? "").trim() || undefined,
    swiftCode: String(formData.get("swiftCode") ?? "").trim() || undefined,
    isPrimary: String(formData.get("isPrimary") ?? "false") === "true"
  });

  await recordSecurityEvent({
    actorId: user.id,
    action: "bank_account.updated",
    success: true,
    targetType: "BankAccount",
    targetId: bankAccount?.id,
    detail: "Bank account updated."
  });

  revalidatePath(`/settings/bank-accounts/${id}`);
  revalidatePath("/settings/bank-accounts");
  redirect(`/settings/bank-accounts/${id}?status=saved`);
}

export default async function EditBankAccountPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ status?: string }>;
}) {
  const session = await auth();
  const user = requireUser(session);
  try {
    requireRole(user, ["ADMIN", "EXECUTIVE", "FINANCE"]);
  } catch {
    redirect("/dashboard");
  }

  const { id } = await params;
  const [account, search] = await Promise.all([getBankAccountById(id), (searchParams ?? Promise.resolve({})) as Promise<{ status?: string }>]);
  if (!account) {
    notFound();
  }

  return (
    <>
      <PageHeader title="แก้ไขบัญชีธนาคาร" description="ปรับข้อมูลบัญชีที่ใช้รับชำระและกระทบยอด" />
      <SimpleForm title="แก้ไขบัญชี" description="อัปเดตข้อมูลบัญชีธนาคารนี้">
        <form action={updateBankAccountAction} className="stack-form form-grid two-column-form">
          <input type="hidden" name="id" value={account.id} />
          <label>
            <span>ธนาคาร</span>
            <input className="input" name="bankName" defaultValue={account.bankName} required />
          </label>
          <label>
            <span>ชื่อบัญชี</span>
            <input className="input" name="accountName" defaultValue={account.accountName} required />
          </label>
          <label>
            <span>เลขที่บัญชี</span>
            <input className="input" name="accountNumber" defaultValue={account.accountNumber} required />
          </label>
          <label>
            <span>สาขา</span>
            <input className="input" name="branch" defaultValue={account.branch ?? ""} />
          </label>
          <label>
            <span>SWIFT</span>
            <input className="input" name="swiftCode" defaultValue={account.swiftCode ?? ""} />
          </label>
          <label>
            <span>เป็นบัญชีหลัก</span>
            <select className="input" name="isPrimary" defaultValue={String(account.isPrimary)}>
              <option value="false">ไม่ใช่</option>
              <option value="true">ใช่</option>
            </select>
          </label>
          {search?.status === "saved" ? <p className="security-note success-note full-span">บันทึกการเปลี่ยนแปลงแล้ว</p> : null}
          <div className="full-span">
            <button className="button" type="submit">บันทึกการแก้ไข</button>
          </div>
        </form>
      </SimpleForm>
    </>
  );
}
