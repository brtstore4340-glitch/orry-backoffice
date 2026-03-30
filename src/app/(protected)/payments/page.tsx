export const dynamic = 'force-dynamic'
import Link from "next/link";
import { PageHeader } from "@/components/app-shell/page-header";
import { DataTable } from "@/components/data-table/data-table";
import { Workspace } from "@/components/app-shell/workspace";
import { StatusBadge } from "@/components/status/status-badge";
import { getDocuments } from "@/lib/repository";

export default async function PaymentsPage() {
  const billing = await getDocuments("BILLING_RECORD");
  const receipts = await getDocuments("RECEIPT");
  const rows = [...billing, ...receipts].sort((left, right) => right.issuedAt.localeCompare(left.issuedAt));

  return (
    <>
      <PageHeader title="Payments" description="Collection and settlement watchlist across issued billing records and paid receipts." />
      <Workspace>
        <div className="section-heading">
          <div>
            <h2>Settlement tracker</h2>
            <p>Track which commercial records are still collectible and which have landed as receipts.</p>
          </div>
        </div>
        <DataTable
          columns={["Document", "Kind", "Account", "Status", "Issued", "Value"]}
          rows={rows.map((document) => [
            <Link key={`${document.id}-link`} href={`/documents/${document.id}`} className="inline-link">{document.documentNumber}</Link>,
            document.kind.replaceAll("_", " "),
            document.accountName,
            <StatusBadge key={`${document.id}-status`} label={document.status} />, 
            document.issuedAt,
            new Intl.NumberFormat("en-US", { style: "currency", currency: "THB" }).format(document.totalAmount)
          ])}
        />
      </Workspace>
    </>
  );
}