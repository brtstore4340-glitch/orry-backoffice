import Link from "next/link";
import { createDraftDocumentAction } from "@/app/(protected)/actions";
import { DataTable } from "@/components/data-table/data-table";
import { SimpleForm } from "@/components/forms/simple-form";
import { StatusBadge } from "@/components/status/status-badge";
import { getDocuments } from "@/lib/repository";
import { DocumentKind } from "@/lib/types";

function kindLabel(kind: DocumentKind) {
  switch (kind) {
    case "PROPOSAL":
      return "proposal";
    case "SALES_ORDER":
      return "sales order";
    case "BILLING_RECORD":
      return "billing record";
    case "RECEIPT":
      return "receipt";
    case "PURCHASE_ORDER":
      return "purchase order";
    case "EXPENSE":
      return "expense";
  }
}

export async function DocumentListPage({ title, description, kind }: { title: string; description: string; kind: DocumentKind }) {
  const documents = await getDocuments(kind);

  return (
    <>
      <SimpleForm title={`Create ${kindLabel(kind)} draft`} description="Create a server-side document stub that can be completed with lines, totals, approvals, and settlement metadata.">
        <form action={createDraftDocumentAction} className="inline-form">
          <input type="hidden" name="kind" value={kind} />
          <input className="input" name="note" placeholder="Optional internal note" />
          <button className="button" type="submit">Create draft</button>
        </form>
      </SimpleForm>

      <section className="workspace chrome-panel">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Document queue</span>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
          <div className="section-meta-chip">{documents.length} active records</div>
        </div>
        <DataTable
          columns={["Document", "Account", "Status", "Issued", "Total", "Project"]}
          rows={documents.map((document) => [
            <Link key={`${document.id}-link`} href={`/documents/${document.id}`} className="inline-link">{document.documentNumber}</Link>,
            document.accountName,
            <StatusBadge key={`${document.id}-status`} label={document.status} />,
            document.issuedAt,
            new Intl.NumberFormat("en-US", { style: "currency", currency: "THB" }).format(document.totalAmount),
            document.projectName ?? "-"
          ])}
        />
      </section>
    </>
  );
}
