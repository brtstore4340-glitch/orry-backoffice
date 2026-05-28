import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app-shell/page-header";
import { DataTable } from "@/components/data-table/data-table";
import { DetailPanel } from "@/components/detail-panel/detail-panel";
import { SimpleForm } from "@/components/forms/simple-form";
import { StatusBadge } from "@/components/status/status-badge";
import { Workspace } from "@/components/app-shell/workspace";
import {
  formatAccountingAmount,
  formatAccountingDate,
  getAccountingDocument,
  getModuleActions,
  getModuleCreatePath,
  getModuleDefinition,
  getModuleDetailPath,
  getModuleStatusOptions,
  listAccountingDocuments,
  resolveDocumentStatusTone
} from "@/lib/accounting-documents";
import { thaiCanonicalTerms } from "@/lib/thai-terminology";
import { getContacts, getProducts, listCompanyBranches } from "@/lib/repository";
import type { DocumentModuleKey } from "@/lib/types";
import {
  addAccountingDocumentLineAction,
  createAccountingModuleDraftAction,
  duplicateAccountingDocumentAction,
  recordAccountingDocumentAttachmentAction,
  recordAccountingDocumentEmailAction,
  recordAccountingDocumentPaymentAction,
  recordAccountingDocumentShareAction,
  updateAccountingDocumentContactAction,
  updateAccountingDocumentLineAction,
  updateAccountingDocumentStatusAction
} from "@/app/(protected)/actions";

function ActionButton({ label, tone = "default" }: { label: string; tone?: "default" | "ghost" }) {
  return <button className={`button${tone === "ghost" ? " ghost-button" : ""}`} type="submit">{label}</button>;
}

export async function AccountingDocumentListPage({ moduleKey }: { moduleKey: DocumentModuleKey }) {
  const definition = getModuleDefinition(moduleKey);
  const documents = await listAccountingDocuments(moduleKey);
  const actions = getModuleActions(moduleKey);

  return (
    <>
      <PageHeader
        eyebrow="ORRY เอกสาร"
        title={definition.title}
        description={definition.description}
        actions={
          <form action={createAccountingModuleDraftAction}>
            <input type="hidden" name="moduleKey" value={moduleKey} />
            <ActionButton label={definition.createLabel} />
          </form>
        }
      />

      <Workspace>
        <div className="section-heading">
          <div>
            <span className="eyebrow">สถานะเอกสาร</span>
            <h2>{definition.title}</h2>
            <p>รองรับสร้างฉบับร่าง อนุมัติ ส่งต่อ และติดตามประวัติการทำงานของเอกสารชุดนี้</p>
          </div>
          <div className="section-meta-chip">{documents.length} รายการ</div>
        </div>
        <div className="stack-list action-chip-row">
          {actions.slice(0, 6).map((action) => (
            <span key={action.key} className="action-chip">{action.label}</span>
          ))}
        </div>
        <DataTable
          columns={["เลขที่เอกสาร", "คู่ค้า", "สถานะ", "วันที่ออก", "ครบกำหนด", "มูลค่า", "อ้างอิง"]}
          rows={documents.map((document) => [
            <Link key={`${document.id}-link`} href={getModuleDetailPath(moduleKey, document.id)} className="inline-link">
              {document.documentNumber}
            </Link>,
            document.accountName,
            <StatusBadge key={`${document.id}-status`} label={document.status} tone={resolveDocumentStatusTone(document.status)} />,
            formatAccountingDate(document.issuedAt),
            formatAccountingDate(document.dueAt),
            formatAccountingAmount(document.totalAmount),
            document.referenceCode ?? "-"
          ])}
        />
      </Workspace>
    </>
  );
}

export async function AccountingDocumentCreatePage({ moduleKey }: { moduleKey: DocumentModuleKey }) {
  const definition = getModuleDefinition(moduleKey);
  const branches: Awaited<ReturnType<typeof listCompanyBranches>> = await listCompanyBranches().catch(() => []);

  return (
    <>
      <PageHeader
        eyebrow="ORRY เอกสาร"
        title={definition.createLabel}
        description={`สร้างฉบับร่างของ ${definition.title} และเริ่มทำงานต่อจากแบบฟอร์มกลางเดียว`}
      />
      <SimpleForm title={definition.createLabel} description="บันทึกฉบับร่างลงฐานข้อมูลก่อน แล้วค่อยเติมรายการภายหลัง">
        <form action={createAccountingModuleDraftAction} className="stack-form compact-form">
          <input type="hidden" name="moduleKey" value={moduleKey} />
          {branches.length ? (
            <label>
              <span>สาขา</span>
              <select className="input" name="branchId" defaultValue={branches[0]?.id}>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.branchName} ({branch.branchCode})
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label>
            <span>หมายเหตุภายใน</span>
            <textarea className="input" name="note" rows={4} placeholder="บันทึกเหตุผลหรือเงื่อนไขของเอกสาร" />
          </label>
          <button className="button" type="submit">{definition.createLabel}</button>
        </form>
      </SimpleForm>
    </>
  );
}

export async function AccountingDocumentDetailPage({ moduleKey, id }: { moduleKey: DocumentModuleKey; id: string }) {
  const definition = getModuleDefinition(moduleKey);
  const [document, contacts, products] = await Promise.all([
    getAccountingDocument(moduleKey, id),
    getContacts(),
    getProducts(),
  ]);

  if (!document) {
    notFound();
  }

  const statusOptions = getModuleStatusOptions(moduleKey);
  const actionKeys = new Set(definition.actionKeys);

  return (
    <>
      <PageHeader
        eyebrow="ORRY เอกสาร"
        title={document.documentNumber}
        description={`${definition.title} · ${document.accountName}`}
        actions={<StatusBadge label={document.status} tone={resolveDocumentStatusTone(document.status)} />}
      />

      <div className="content-grid two-up">
        <DetailPanel title="ข้อมูลหลัก" subtitle="ข้อมูลคู่ค้า วันออกเอกสาร และยอดรวมของรายการ">
          <dl className="definition-list compact-definition-list">
            <div><dt>คู่ค้า</dt><dd>{document.accountName}</dd></div>
            <div><dt>สาขา</dt><dd>{document.branchName ?? "-"}</dd></div>
            <div><dt>วันที่ออก</dt><dd>{formatAccountingDate(document.issuedAt)}</dd></div>
            <div><dt>วันครบกำหนด</dt><dd>{formatAccountingDate(document.dueAt)}</dd></div>
            <div><dt>โปรเจกต์</dt><dd>{document.projectName ?? "-"}</dd></div>
            <div><dt>อ้างอิง</dt><dd>{document.referenceCode ?? "-"}</dd></div>
            <div><dt>มูลค่ารวม</dt><dd>{formatAccountingAmount(document.totalAmount)}</dd></div>
          </dl>
          {document.notes ? <p className="inline-note">{document.notes}</p> : null}
          {document.internalNotes ? <p className="inline-note dimmed">{document.internalNotes}</p> : null}
          {contacts.length ? (
            <form action={updateAccountingDocumentContactAction} className="stack-form compact-form">
              <input type="hidden" name="moduleKey" value={moduleKey} />
              <input type="hidden" name="id" value={document.id} />
              <label>
                <span>เปลี่ยนคู่ค้า</span>
                <select className="input" name="contactId" defaultValue={contacts.find((contact) => contact.displayName === document.accountName)?.id}>
                  {contacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.displayName} ({contact.code})
                    </option>
                  ))}
                </select>
              </label>
              <ActionButton label="บันทึกคู่ค้า" tone="ghost" />
            </form>
          ) : null}
        </DetailPanel>

        <DetailPanel title="การทำงาน" subtitle="อัปเดตสถานะ แชร์ ส่งอีเมล พิมพ์ หรือทำสำเนาได้จากหน้านี้">
          <div className="stack-form compact-form">
            <form action={updateAccountingDocumentStatusAction} className="stack-form compact-form">
              <input type="hidden" name="moduleKey" value={moduleKey} />
              <input type="hidden" name="id" value={document.id} />
              <label>
                <span>สถานะ</span>
                <select className="input" name="status" defaultValue={document.status}>
                  {statusOptions.map((status) => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </label>
              <ActionButton label="บันทึกสถานะ" />
            </form>

            <div className="stack-list action-grid">
              {actionKeys.has("duplicate") ? (
                <form action={duplicateAccountingDocumentAction}>
                  <input type="hidden" name="moduleKey" value={moduleKey} />
                  <input type="hidden" name="id" value={document.id} />
                  <ActionButton label="ทำสำเนา" tone="ghost" />
                </form>
              ) : null}
              {actionKeys.has("share") ? (
                <form action={recordAccountingDocumentShareAction} className="stack-form">
                  <input type="hidden" name="moduleKey" value={moduleKey} />
                  <input type="hidden" name="id" value={document.id} />
                  <label>
                    <span>ช่องทางแชร์</span>
                    <input className="input" name="channel" defaultValue="ลิงก์" placeholder="ลิงก์ / อีเมล / แชต" />
                  </label>
                  <label>
                    <span>ผู้รับ</span>
                    <input className="input" name="sharedTo" placeholder="อีเมลหรือผู้รับปลายทาง" />
                  </label>
                  <label>
                    <span>ข้อความ</span>
                    <textarea className="input" name="message" rows={3} placeholder="ข้อความประกอบการแชร์" />
                  </label>
                  <ActionButton label="แชร์" tone="ghost" />
                </form>
              ) : null}
              {actionKeys.has("email") ? (
                <form action={recordAccountingDocumentEmailAction} className="stack-form">
                  <input type="hidden" name="moduleKey" value={moduleKey} />
                  <input type="hidden" name="id" value={document.id} />
                  <label>
                    <span>ส่งถึง</span>
                    <input className="input" name="sentTo" placeholder="recipient@company.co" />
                  </label>
                  <label>
                    <span>หัวข้อ</span>
                    <input className="input" name="subject" defaultValue={`${definition.title} ${document.documentNumber}`} />
                  </label>
                  <label>
                    <span>ข้อความสรุป</span>
                    <textarea className="input" name="bodyPreview" rows={3} placeholder="สรุปใจความสั้น ๆ" />
                  </label>
                  <ActionButton label="ส่งอีเมล" tone="ghost" />
                </form>
              ) : null}
              {actionKeys.has("addAttachment") ? (
                <form action={recordAccountingDocumentAttachmentAction} className="stack-form">
                  <input type="hidden" name="moduleKey" value={moduleKey} />
                  <input type="hidden" name="id" value={document.id} />
                  <label>
                    <span>ชื่อไฟล์</span>
                    <input className="input" name="fileName" placeholder="invoice.pdf" />
                  </label>
                  <label>
                    <span>ตำแหน่งไฟล์</span>
                    <input className="input" name="storagePath" placeholder="documents/2026/invoice.pdf" />
                  </label>
                  <label>
                    <span>MIME type</span>
                    <input className="input" name="mimeType" placeholder="application/pdf" />
                  </label>
                  <label>
                    <span>ขนาดไฟล์ (bytes)</span>
                    <input className="input" name="fileSize" inputMode="numeric" placeholder="0" />
                  </label>
                  <ActionButton label="แนบไฟล์" tone="ghost" />
                </form>
              ) : null}
              {actionKeys.has("recordPayment") || actionKeys.has("recordReceipt") ? (
                <>
                  <form action={recordAccountingDocumentPaymentAction} className="stack-form">
                    <input type="hidden" name="moduleKey" value={moduleKey} />
                    <input type="hidden" name="id" value={document.id} />
                    <label>
                      <span>จำนวนเงิน</span>
                      <input className="input" name="amount" inputMode="decimal" placeholder="0.00" />
                    </label>
                    <label>
                      <span>ช่องทางชำระ</span>
                      <select className="input" name="method" defaultValue="TRANSFER">
                        <option value="TRANSFER">โอนเงิน</option>
                        <option value="CASH">เงินสด</option>
                        <option value="CREDIT_CARD">บัตรเครดิต</option>
                        <option value="CHEQUE">เช็ค</option>
                      </select>
                    </label>
                    <label>
                      <span>เลขอ้างอิง</span>
                      <input className="input" name="referenceNumber" placeholder="TRX-0001" />
                    </label>
                    <label>
                      <span>หมายเหตุ</span>
                      <textarea className="input" name="note" rows={3} placeholder="บันทึกการรับหรือจ่ายเงิน" />
                    </label>
                    <ActionButton label={actionKeys.has("recordReceipt") ? thaiCanonicalTerms.recordReceipt : "บันทึกการชำระเงิน"} tone="ghost" />
                  </form>
                </>
              ) : null}
              <Link href={getModuleCreatePath(moduleKey)} className="button ghost-button">
                สร้างฉบับใหม่
              </Link>
            </div>
          </div>
        </DetailPanel>
      </div>

      <Workspace>
        <div className="section-heading">
          <div>
            <span className="eyebrow">รายการ</span>
            <h2>รายละเอียดบรรทัด</h2>
            <p>คำนวณรายการและยอดเงินด้วยโครงสร้างเดียวกันในทุกประเภทเอกสาร</p>
          </div>
        </div>
        {products.length ? (
          <form action={addAccountingDocumentLineAction} className="stack-form compact-form">
            <input type="hidden" name="moduleKey" value={moduleKey} />
            <input type="hidden" name="id" value={document.id} />
            <label>
              <span>สินค้า/บริการ</span>
              <select className="input" name="productId" defaultValue={products[0]?.id}>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.sku})
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>จำนวน</span>
              <input className="input" name="quantity" inputMode="decimal" defaultValue="1" />
            </label>
            <label>
              <span>ราคา/หน่วย</span>
              <input className="input" name="unitPrice" inputMode="decimal" placeholder="ใช้ราคาสินค้าเดิมหากเว้นว่าง" />
            </label>
            <label>
              <span>รายละเอียดเพิ่มเติม</span>
              <textarea className="input" name="description" rows={3} placeholder="หมายเหตุของบรรทัดรายการ" />
            </label>
            <ActionButton label="เพิ่มรายการ" tone="ghost" />
          </form>
        ) : null}
        <DataTable
          columns={["รายการ", "รายละเอียด", "จำนวน", "ราคา/หน่วย", "รวม"]}
          rows={
            document.lines.length
              ? document.lines.map((line) => [
                  <div key={`${line.id}-title`}>
                    <strong>{line.title}</strong>
                    <form action={updateAccountingDocumentLineAction} className="stack-form compact-form">
                      <input type="hidden" name="moduleKey" value={moduleKey} />
                      <input type="hidden" name="id" value={document.id} />
                      <input type="hidden" name="lineId" value={line.id} />
                      <label>
                        <span>รายละเอียด</span>
                        <textarea className="input" name="description" rows={2} defaultValue={line.description ?? ""} />
                      </label>
                      <label>
                        <span>จำนวน</span>
                        <input className="input" name="quantity" inputMode="decimal" defaultValue={line.quantity} />
                      </label>
                      <label>
                        <span>ราคา/หน่วย</span>
                        <input className="input" name="unitPrice" inputMode="decimal" defaultValue={line.unitPrice} />
                      </label>
                      <ActionButton label="บันทึกรายการ" tone="ghost" />
                    </form>
                  </div>,
                  line.description ?? "-",
                  `${line.quantity} ${line.unitLabel}`,
                  formatAccountingAmount(line.unitPrice),
                  formatAccountingAmount(line.lineTotal)
                ])
              : [[<span key="empty-lines" className="empty-state">ไม่มีรายการบรรทัด</span>, "-", "-", "-", "-"]]
          }
        />
      </Workspace>

      <div className="content-grid two-up">
        <Workspace>
          <div className="section-heading">
            <div>
              <span className="eyebrow">สรุปยอด</span>
              <h2>คำนวณเอกสาร</h2>
              <p>ยอดรวม ส่วนลด ภาษี และยอดหัก ณ ที่จ่าย</p>
            </div>
          </div>
          <dl className="definition-list compact-definition-list">
            <div><dt>ยอดก่อนส่วนลด</dt><dd>{formatAccountingAmount(document.subtotalAmount)}</dd></div>
            <div><dt>ส่วนลด</dt><dd>{formatAccountingAmount(document.discountAmount)}</dd></div>
            <div><dt>ยอดหลังส่วนลด</dt><dd>{formatAccountingAmount(document.totalAfterDiscountAmount)}</dd></div>
            <div><dt>ภาษีมูลค่าเพิ่ม</dt><dd>{formatAccountingAmount(document.vatAmount)}</dd></div>
            <div><dt>หัก ณ ที่จ่าย</dt><dd>{formatAccountingAmount(document.withholdingAmount)}</dd></div>
            <div><dt>ยอดรวม</dt><dd>{formatAccountingAmount(document.totalAmount)}</dd></div>
          </dl>
        </Workspace>

        <Workspace>
          <div className="section-heading">
            <div>
              <span className="eyebrow">ประวัติ</span>
              <h2>Timeline</h2>
              <p>ติดตามเหตุการณ์ สถานะ การแชร์ และการรับชำระ</p>
            </div>
          </div>
          <div className="timeline">
            {document.activities.map((activity) => (
              <article key={activity.id} className="timeline-item subtle-panel">
                <div className="timeline-item-head">
                  <strong>{activity.action}</strong>
                  <span className="timeline-date">{activity.createdAt}</span>
                </div>
                <p>{activity.detail}</p>
                <small>{activity.actor ?? "ระบบ ORRY"}</small>
              </article>
            ))}
            {!document.activities.length ? <p className="empty-state">ยังไม่มีประวัติ</p> : null}
          </div>

          {document.attachments.length ? (
            <div className="stack-list">
              {document.attachments.map((attachment) => (
                <article key={attachment.id} className="subtle-panel list-row">
                  <div>
                    <strong>{attachment.fileName}</strong>
                    <p>{attachment.mimeType ?? attachment.storagePath}</p>
                  </div>
                </article>
              ))}
            </div>
          ) : null}

          {document.payments.length ? (
            <div className="stack-list">
              {document.payments.map((payment) => (
                <article key={payment.id} className="subtle-panel list-row emphasis-row">
                  <div>
                    <strong>{payment.method}</strong>
                    <p>{payment.referenceNumber ?? "ไม่มีเลขอ้างอิง"}</p>
                  </div>
                  <div className="value-block">
                    <strong>{formatAccountingAmount(payment.amount)}</strong>
                    <small>{payment.paidAt}</small>
                  </div>
                </article>
              ))}
            </div>
          ) : null}

          {document.references.length ? (
            <div className="stack-list reference-list">
              {document.references.map((reference) => (
                <Link key={`${reference.documentId}-${reference.documentNumber}`} href={getModuleDetailPath(moduleKey, reference.documentId)} className="inline-link reference-link">
                  {reference.label}: {reference.documentNumber}
                </Link>
              ))}
            </div>
          ) : null}
        </Workspace>
      </div>
    </>
  );
}
