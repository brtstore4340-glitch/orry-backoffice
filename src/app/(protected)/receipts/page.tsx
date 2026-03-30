export const dynamic = 'force-dynamic'
import { PageHeader } from "@/components/app-shell/page-header";
import { DocumentListPage } from "@/components/documents/document-list-page";

export default function ReceiptsPage() {
  return (
    <>
      <PageHeader title="Receipts" description="Collection receipts and settlement evidence linked back to ORRY billing records." />
      <DocumentListPage title="Receipt queue" description="Collected and pending receipt records across active accounts." kind="RECEIPT" />
    </>
  );
}