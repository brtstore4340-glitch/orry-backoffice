export const dynamic = "force-dynamic";
import { PageHeader } from "@/components/app-shell/page-header";
import { SimpleForm } from "@/components/forms/simple-form";
import { Workspace } from "@/components/app-shell/workspace";
import { createContactAction } from "@/app/(protected)/actions";
import { thaiCanonicalTerms } from "@/lib/thai-terminology";

export default function NewContactPage() {
  return (
    <>
      <PageHeader title="เพิ่มผู้ติดต่อ" description={`สร้างข้อมูลลูกค้า ผู้ขาย หรือ${thaiCanonicalTerms.partner}เพื่อใช้ในทุกเอกสารของ ORRY`} eyebrow="Contacts" />
      <div className="content-grid two-up">
        <SimpleForm title="ข้อมูลผู้ติดต่อ" description={`ใช้สำหรับใบเสนอราคา ใบกำกับภาษี ${thaiCanonicalTerms.expense} และใบสั่งซื้อ`}>
          <form action={createContactAction} className="stack-form compact-form">
            <label><span>รหัสผู้ติดต่อ</span><input className="input" name="code" placeholder="CNT-0001" required /></label>
            <label><span>ชื่อแสดงผล</span><input className="input" name="displayName" placeholder="บริษัทตัวอย่าง จำกัด" required /></label>
            <label><span>ผู้ประสานงาน</span><input className="input" name="contactPerson" placeholder="ชื่อผู้ติดต่อ" /></label>
            <label><span>อีเมล</span><input className="input" name="email" type="email" placeholder="contact@example.com" /></label>
            <button className="button" type="submit">บันทึกผู้ติดต่อ</button>
          </form>
        </SimpleForm>
        <Workspace>
          <div className="section-heading">
            <div>
              <span className="eyebrow">Tax & Address</span>
              <h2>ข้อมูลภาษีและที่อยู่</h2>
              <p>รองรับข้อมูลสาขา เลขประจำตัวผู้เสียภาษี และที่อยู่สำหรับพิมพ์บนเอกสาร</p>
            </div>
          </div>
          <ul className="bullet-stack settings-notes">
            <li>รองรับหลายที่อยู่และข้อมูลภาษีแยกจากข้อมูลติดต่อ</li>
            <li>รองรับสถานะใช้งาน ไม่ใช้งาน และเก็บถาวร</li>
            <li>เชื่อมกับประวัติเอกสารและการติดตามหนี้</li>
          </ul>
        </Workspace>
      </div>
    </>
  );
}
