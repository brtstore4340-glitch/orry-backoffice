export const dynamic = "force-dynamic";

import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { PageHeader } from "@/components/app-shell/page-header";
import { SimpleForm } from "@/components/forms/simple-form";
import { requireRole, requireUser } from "@/lib/authorization";
import { recordSecurityEvent } from "@/lib/audit";
import { getContactById, updateContact } from "@/lib/repository";
import { thaiCanonicalTerms } from "@/lib/thai-terminology";

async function updateContactAction(formData: FormData) {
  "use server";

  const session = await auth();
  const user = requireUser(session);
  try {
    requireRole(user, ["ADMIN", "SALES", "OPERATIONS", "EXECUTIVE"]);
  } catch {
    redirect("/dashboard");
  }

  const id = String(formData.get("id") ?? "");
  const contact = await updateContact({
    id,
    code: String(formData.get("code") ?? "").trim().toUpperCase(),
    displayName: String(formData.get("displayName") ?? "").trim(),
    type: String(formData.get("type") ?? "CUSTOMER"),
    contactPerson: String(formData.get("contactPerson") ?? "").trim() || undefined,
    email: String(formData.get("email") ?? "").trim() || undefined,
    phone: String(formData.get("phone") ?? "").trim() || undefined,
    mobile: String(formData.get("mobile") ?? "").trim() || undefined,
    address: String(formData.get("address") ?? "").trim() || undefined,
    notes: String(formData.get("notes") ?? "").trim() || undefined
  });

  await recordSecurityEvent({
    actorId: user.id,
    action: "contact.updated",
    success: true,
    targetType: "Contact",
    targetId: contact?.id,
    detail: "Contact updated."
  });

  revalidatePath(`/contacts/${id}`);
  revalidatePath("/contacts");
  redirect(`/contacts/${id}`);
}

export default async function EditContactPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contact = await getContactById(id);
  if (!contact) notFound();

  return (
    <>
      <PageHeader title="แก้ไขผู้ติดต่อ" description="อัปเดตข้อมูลคู่ค้าให้ตรงกับการใช้งานจริง" eyebrow="Contacts" />
      <SimpleForm title={contact.displayName} description="ข้อมูลนี้จะถูกใช้บนเอกสารและรายงานที่เกี่ยวข้อง">
        <form action={updateContactAction} className="stack-form compact-form">
          <input type="hidden" name="id" value={contact.id} />
          <label><span>รหัสผู้ติดต่อ</span><input className="input" name="code" defaultValue={contact.code} required /></label>
          <label><span>ชื่อแสดงผล</span><input className="input" name="displayName" defaultValue={contact.displayName} required /></label>
          <label>
            <span>ประเภท</span>
            <select className="input" name="type" defaultValue={contact.type}>
              <option value="CUSTOMER">ลูกค้า</option>
              <option value="COMPANY">บริษัท</option>
              <option value="VENDOR">ผู้ขาย</option>
              <option value="PARTNER">{thaiCanonicalTerms.partner}</option>
            </select>
          </label>
          <label><span>ผู้ประสานงาน</span><input className="input" name="contactPerson" defaultValue={contact.contactPerson ?? ""} /></label>
          <label><span>อีเมล</span><input className="input" name="email" type="email" defaultValue={contact.email ?? ""} /></label>
          <label><span>โทรศัพท์</span><input className="input" name="phone" defaultValue={contact.phone ?? ""} /></label>
          <label><span>มือถือ</span><input className="input" name="mobile" defaultValue={contact.mobile ?? ""} /></label>
          <label><span>ที่อยู่</span><textarea className="input" name="address" rows={3} defaultValue={contact.address ?? ""} /></label>
          <label><span>หมายเหตุ</span><textarea className="input" name="notes" rows={3} defaultValue={contact.notes ?? ""} /></label>
          <button className="button" type="submit">บันทึกผู้ติดต่อ</button>
        </form>
      </SimpleForm>
    </>
  );
}
