export const dynamic = "force-dynamic";

import Link from "next/link";
import { PageHeader } from "@/components/app-shell/page-header";
import { DataTable } from "@/components/data-table/data-table";
import { SimpleForm } from "@/components/forms/simple-form";
import { StatusBadge } from "@/components/status/status-badge";
import { createContactAction } from "@/app/(protected)/actions";
import { getContacts } from "@/lib/repository";
import { thaiContactTypeLabels } from "@/lib/orry-labels";
import { thaiCanonicalTerms } from "@/lib/thai-terminology";

export default async function ContactsPage() {
  const contacts = await getContacts();

  return (
    <>
      <PageHeader title="ผู้ติดต่อ" description={`จัดการลูกค้า ผู้ขาย และ${thaiCanonicalTerms.partner}ที่ใช้งานในเอกสารของ ORRY`} />
      <div className="content-grid two-up">
        <SimpleForm title="เพิ่มผู้ติดต่อ" description={`บันทึกข้อมูลลูกค้า ผู้ขาย หรือ${thaiCanonicalTerms.partner}ใหม่`}>
          <form action={createContactAction} className="stack-form compact-form">
            <label>
              <span>รหัสผู้ติดต่อ</span>
              <input className="input" name="code" placeholder="CNT-003" required />
            </label>
            <label>
              <span>ชื่อที่แสดง</span>
              <input className="input" name="displayName" placeholder="คู่ค้ารายใหม่" required />
            </label>
            <label>
              <span>ผู้ติดต่อหลัก</span>
              <input className="input" name="contactPerson" placeholder="ชื่อผู้ประสานงาน" />
            </label>
            <label>
              <span>อีเมล</span>
              <input className="input" name="email" type="email" placeholder="contact@example.co" />
            </label>
            <button className="button" type="submit">บันทึกผู้ติดต่อ</button>
          </form>
        </SimpleForm>
        <section className="workspace chrome-panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">ภาพรวม</span>
              <h2>{thaiCanonicalTerms.contactsOverview}</h2>
              <p>ดูจำนวนเอกสารค้างและความพร้อมในการติดต่อของแต่ละราย</p>
            </div>
          </div>
          <div className="stack-list">
            {contacts.slice(0, 3).map((contact) => (
              <article key={contact.id} className="subtle-panel list-row emphasis-row">
                <div>
                  <strong>{contact.displayName}</strong>
                  <p>{contact.contactPerson ?? "ยังไม่มีผู้ติดต่อหลัก"}</p>
                </div>
                <StatusBadge label={contact.openDocuments ? "OPEN" : "ACTIVE"} tone={contact.openDocuments ? "warning" : "success"} />
              </article>
            ))}
          </div>
        </section>
      </div>
      <section className="workspace chrome-panel">
        <div className="section-heading">
          <div>
              <span className="eyebrow">รายชื่อทั้งหมด</span>
              <h2>{thaiCanonicalTerms.contactsDirectory}</h2>
              <p>{`ข้อมูลใช้งานจริงสำหรับลูกค้า ผู้ขาย และ${thaiCanonicalTerms.partner}`}</p>
          </div>
          <div className="section-meta-chip">{contacts.length} รายการ</div>
        </div>
        <DataTable
          columns={["รหัส", "ชื่อ", "ประเภท", "ผู้ติดต่อหลัก", "อีเมล", "เปิดเอกสาร", "รายละเอียด"]}
          rows={contacts.map((contact) => [
            contact.code,
            <Link key={`${contact.id}-name`} href={`/contacts/${contact.id}`} className="inline-link">{contact.displayName}</Link>,
            thaiContactTypeLabels[contact.type],
            contact.contactPerson ?? "-",
            contact.email ?? "-",
            contact.openDocuments.toString(),
            <Link key={`${contact.id}-detail`} href={`/contacts/${contact.id}/edit`} className="inline-link">แก้ไข</Link>
          ])}
        />
      </section>
    </>
  );
}
