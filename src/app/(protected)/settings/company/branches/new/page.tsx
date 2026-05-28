export const dynamic = "force-dynamic";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PageHeader } from "@/components/app-shell/page-header";
import { SimpleForm } from "@/components/forms/simple-form";
import { requireRole, requireUser } from "@/lib/authorization";
import { recordSecurityEvent } from "@/lib/audit";
import { createCompanyBranch, getCompanyProfile } from "@/lib/repository";

async function createCompanyBranchAction(formData: FormData) {
  "use server";

  const session = await auth();
  const user = requireUser(session);
  try {
    requireRole(user, ["ADMIN", "EXECUTIVE", "FINANCE"]);
  } catch {
    redirect("/dashboard");
  }

  const company = await getCompanyProfile();
  const branch = await createCompanyBranch({
    companyProfileId: company.id,
    branchCode: String(formData.get("branchCode") ?? "").trim(),
    branchName: String(formData.get("branchName") ?? "").trim(),
    isHeadOffice: String(formData.get("isHeadOffice") ?? "false") === "true"
  });

  await recordSecurityEvent({
    actorId: user.id,
    action: "company_branch.created",
    success: true,
    targetType: "CompanyBranch",
    targetId: branch?.id,
    detail: "Company branch created."
  });

  revalidatePath("/settings/company");
  revalidatePath("/settings/company/branches");
  redirect("/settings/company/branches");
}

export default async function NewCompanyBranchPage() {
  const session = await auth();
  const user = requireUser(session);
  try {
    requireRole(user, ["ADMIN", "EXECUTIVE", "FINANCE"]);
  } catch {
    redirect("/dashboard");
  }

  return (
    <>
      <PageHeader title="เพิ่มสาขา" description="สร้างสาขาที่ใช้งานบนเอกสารของ ORRY" eyebrow="Company Information" />
      <SimpleForm title="ข้อมูลสาขา" description="กำหนดชื่อและรหัสสาขาให้ตรงกับการใช้งานจริง">
        <form action={createCompanyBranchAction} className="stack-form compact-form">
          <label><span>ชื่อสาขา</span><input className="input" name="branchName" placeholder="สำนักงานใหญ่" required /></label>
          <label><span>รหัสสาขา</span><input className="input" name="branchCode" placeholder="00000" required /></label>
          <label>
            <span>เป็นสาขาหลัก</span>
            <select className="input" name="isHeadOffice" defaultValue="false">
              <option value="false">ไม่ใช่</option>
              <option value="true">ใช่</option>
            </select>
          </label>
          <button className="button" type="submit">บันทึกสาขา</button>
        </form>
      </SimpleForm>
    </>
  );
}
