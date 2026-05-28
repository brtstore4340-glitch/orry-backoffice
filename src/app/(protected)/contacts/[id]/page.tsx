export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/app-shell/page-header";
import { DetailPanel } from "@/components/detail-panel/detail-panel";
import { Workspace } from "@/components/app-shell/workspace";
import { getContactById } from "@/lib/repository";
import { thaiContactTypeLabels } from "@/lib/orry-labels";

export default async function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contact = await getContactById(id);

  if (!contact) notFound();

  return (
    <>
      <PageHeader title={contact.displayName} description="ข้อมูลผู้ติดต่อและภาระเอกสารที่เกี่ยวข้อง" eyebrow="Contacts" actions={<Link href={`/contacts/${contact.id}/edit`} className="button">แก้ไข</Link>} />
      <div className="content-grid two-up">
        <DetailPanel title="ข้อมูลพื้นฐาน" subtitle="พร้อมใช้งานบนเอกสารซื้อขายและภาษี">
          <dl className="definition-list settings-grid">
            <div><dt>รหัสผู้ติดต่อ</dt><dd>{contact.code}</dd></div>
            <div><dt>ประเภท</dt><dd>{thaiContactTypeLabels[contact.type]}</dd></div>
            <div><dt>ผู้ประสานงาน</dt><dd>{contact.contactPerson ?? "-"}</dd></div>
            <div><dt>อีเมล</dt><dd>{contact.email ?? "-"}</dd></div>
            <div><dt>โทรศัพท์</dt><dd>{contact.phone ?? "-"}</dd></div>
            <div><dt>เลขผู้เสียภาษี</dt><dd>{contact.taxId ?? "-"}</dd></div>
          </dl>
        </DetailPanel>
        <Workspace>
          <div className="section-heading">
            <div>
              <span className="eyebrow">Document Load</span>
              <h2>งานเอกสารค้าง</h2>
              <p>ใช้ติดตามภาระเอกสารของคู่ค้ารายนี้</p>
            </div>
          </div>
          <article className="subtle-panel list-row emphasis-row">
            <div>
              <strong>{contact.openDocuments} รายการ</strong>
              <p>เอกสารที่เชื่อมกับผู้ติดต่อนี้</p>
            </div>
          </article>
        </Workspace>
      </div>
    </>
  );
}
