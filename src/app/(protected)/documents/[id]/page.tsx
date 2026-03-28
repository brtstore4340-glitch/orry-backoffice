import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app-shell/page-header";
import { Workspace } from "@/components/app-shell/workspace";
import { DataTable } from "@/components/data-table/data-table";
import { DetailPanel } from "@/components/detail-panel/detail-panel";
import { StatusBadge } from "@/components/status/status-badge";
import { updateDocumentStatusAction } from "@/app/(protected)/actions";
import { getDocumentById } from "@/lib/repository";

const statuses = ["DRAFT", "AWAITING_APPROVAL", "APPROVED", "ISSUED", "FULFILLED", "PAID", "CANCELLED"] as const;

export default async function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const document = await getDocumentById(id);

  if (!document) {
    notFound();
  }

  return (
    <>
      <PageHeader
        title={document.documentNumber}
        description={`${document.kind.replaceAll("_", " ")} for ${document.accountName}`}
        actions={<StatusBadge label={document.status} />}
        eyebrow="Document record"
      />
      <div className="content-grid two-up">
        <DetailPanel title="Commercial summary" subtitle="Key commercial metadata and settlement timing.">
          <dl className="definition-list compact-definition-list">
            <div><dt>Account</dt><dd>{document.accountName}</dd></div>
            <div><dt>Issued</dt><dd>{document.issuedAt}</dd></div>
            <div><dt>Due</dt><dd>{document.dueAt ?? "-"}</dd></div>
            <div><dt>Project</dt><dd>{document.projectName ?? "-"}</dd></div>
            <div><dt>Reference</dt><dd>{document.referenceCode ?? "-"}</dd></div>
            <div><dt>Total</dt><dd>{new Intl.NumberFormat("en-US", { style: "currency", currency: "THB" }).format(document.totalAmount)}</dd></div>
          </dl>
        </DetailPanel>
        <DetailPanel title="Workflow controls" subtitle="Update document state through a safe server action.">
          <form action={updateDocumentStatusAction} className="stack-form compact-form">
            <input type="hidden" name="id" value={document.id} />
            <label>
              <span>Status</span>
              <select className="input" name="status" defaultValue={document.status}>
                {statuses.map((status) => (
                  <option key={status} value={status}>{status.replaceAll("_", " ")}</option>
                ))}
              </select>
            </label>
            <button className="button" type="submit">Apply status update</button>
          </form>
          {document.references.length ? (
            <div className="stack-list reference-list">
              {document.references.map((reference) => (
                <Link className="inline-link reference-link" key={`${reference.documentId}-${reference.label}`} href={`/documents/${reference.documentId}`}>
                  {reference.label}: {reference.documentNumber}
                </Link>
              ))}
            </div>
          ) : null}
        </DetailPanel>
      </div>
      <Workspace>
        <div className="section-heading">
          <div>
            <span className="eyebrow">Commercial lines</span>
            <h2>Line items</h2>
            <p>Document totals and item breakdown aligned to the ORRY document model.</p>
          </div>
        </div>
        <DataTable
          columns={["Item", "Description", "Qty", "Unit price", "Line total"]}
          rows={document.lines.map((line) => [
            line.title,
            line.description ?? "-",
            `${line.quantity} ${line.unitLabel}`,
            new Intl.NumberFormat("en-US", { style: "currency", currency: "THB" }).format(line.unitPrice),
            new Intl.NumberFormat("en-US", { style: "currency", currency: "THB" }).format(line.lineTotal)
          ])}
        />
      </Workspace>
      <div className="content-grid two-up">
        <Workspace>
          <div className="section-heading">
            <div>
              <span className="eyebrow">Calculation panel</span>
              <h2>Totals</h2>
              <p>Commercial calculations carried from the source document model into ORRY terms.</p>
            </div>
          </div>
          <dl className="definition-list compact-definition-list">
            <div><dt>Subtotal</dt><dd>{new Intl.NumberFormat("en-US", { style: "currency", currency: "THB" }).format(document.subtotalAmount)}</dd></div>
            <div><dt>Discount</dt><dd>{new Intl.NumberFormat("en-US", { style: "currency", currency: "THB" }).format(document.discountAmount)}</dd></div>
            <div><dt>After discount</dt><dd>{new Intl.NumberFormat("en-US", { style: "currency", currency: "THB" }).format(document.totalAfterDiscountAmount)}</dd></div>
            <div><dt>VAT</dt><dd>{new Intl.NumberFormat("en-US", { style: "currency", currency: "THB" }).format(document.vatAmount)}</dd></div>
            <div><dt>Withholding</dt><dd>{new Intl.NumberFormat("en-US", { style: "currency", currency: "THB" }).format(document.withholdingAmount)}</dd></div>
            <div><dt>Grand total</dt><dd>{new Intl.NumberFormat("en-US", { style: "currency", currency: "THB" }).format(document.totalAmount)}</dd></div>
          </dl>
          {document.notes ? <p className="inline-note">Public note: {document.notes}</p> : null}
          {document.internalNotes ? <p className="inline-note dimmed">Internal note: {document.internalNotes}</p> : null}
        </Workspace>
        <Workspace>
          <div className="section-heading">
            <div>
              <span className="eyebrow">Audit trail</span>
              <h2>Activity and payments</h2>
              <p>Trace the lifecycle and any collection events linked to the record.</p>
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
                <small>{activity.actor ?? "System operator"}</small>
              </article>
            ))}
            {!document.activities.length ? <p className="empty-state">No activity recorded yet.</p> : null}
          </div>
          {document.payments.length ? (
            <div className="stack-list payments-list">
              {document.payments.map((payment) => (
                <article key={payment.id} className="subtle-panel list-row emphasis-row">
                  <div>
                    <strong>{payment.method.replaceAll("_", " ")}</strong>
                    <p>{payment.referenceNumber ?? "No settlement reference"}</p>
                  </div>
                  <div className="value-block">
                    <strong>{new Intl.NumberFormat("en-US", { style: "currency", currency: "THB" }).format(payment.amount)}</strong>
                    <small>{payment.paidAt}</small>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </Workspace>
      </div>
    </>
  );
}
