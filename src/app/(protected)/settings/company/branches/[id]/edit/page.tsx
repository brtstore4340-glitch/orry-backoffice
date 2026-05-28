export const dynamic = "force-dynamic";

import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { PageHeader } from "@/components/app-shell/page-header";
import { SimpleForm } from "@/components/forms/simple-form";
import { requireRole, requireUser } from "@/lib/authorization";
import { recordSecurityEvent } from "@/lib/audit";
import { getCompanyBranchById, updateCompanyBranch } from "@/lib/repository";

async function updateCompanyBranchAction(formData: FormData) {
  "use server";

  const session = await auth();
  const user = requireUser(session);
  try {
    requireRole(user, ["ADMIN", "EXECUTIVE", "FINANCE"]);
  } catch {
    redirect("/dashboard");
  }

  const id = String(formData.get("id") ?? "");
  const branch = await updateCompanyBranch({
    id,
    branchCode: String(formData.get("branchCode") ?? "").trim(),
    branchName: String(formData.get("branchName") ?? "").trim(),
    isHeadOffice: String(formData.get("isHeadOffice") ?? "false") === "true",
    active: String(formData.get("active") ?? "true") === "true"
  });

  await recordSecurityEvent({
    actorId: user.id,
    action: "company_branch.updated",
    success: true,
    targetType: "CompanyBranch",
    targetId: branch?.id,
    detail: "Company branch updated."
  });

  revalidatePath("/settings/company");
  revalidatePath("/settings/company/branches");
  redirect("/settings/company/branches");
}

export default async function EditCompanyBranchPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = requireUser(session);
  try {
    requireRole(user, ["ADMIN", "EXECUTIVE", "FINANCE"]);
  } catch {
    redirect("/dashboard");
  }

  const { id } = await params;
  const branch = await getCompanyBranchById(id);
  if (!branch) notFound();

  return (
    <>
      <PageHeader title="แก้ไขสาขา" description="ปรับปรุงข้อมูลสาขาที่ใช้บนเอกสาร" eyebrow="Company Information" />
      <SimpleForm title={branch.branchName} description="บันทึกข้อมูลสาขาให้ตรงกับข้อมูลบริษัทและภาษี">
        <form action={updateCompanyBranchAction} className="stack-form compact-form">
          <input type="hidden" name="id" value={branch.id} />
          <label><span>ชื่อสาขา</span><input className="input" name="branchName" defaultValue={branch.branchName} required /></label>
          <label><span>รหัสสาขา</span><input className="input" name="branchCode" defaultValue={branch.branchCode} required /></label>
          <label>
            <span>เป็นสาขาหลัก</span>
            <select className="input" name="isHeadOffice" defaultValue={String(branch.isHeadOffice)}>
              <option value="false">ไม่ใช่</option>
              <option value="true">ใช่</option>
            </select>
          </label>
          <label>
            <span>สถานะ</span>
            <select className="input" name="active" defaultValue={String(branch.active)}>
              <option value="true">ใช้งาน</option>
              <option value="false">ปิดใช้งาน</option>
            </select>
          </label>
          <button className="button" type="submit">บันทึกสาขา</button>
        </form>
      </SimpleForm>
    </>
  );
}
