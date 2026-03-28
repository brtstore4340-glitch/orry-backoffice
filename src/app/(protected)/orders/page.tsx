import { PageHeader } from "@/components/app-shell/page-header";
import { DocumentListPage } from "@/components/documents/document-list-page";

export default function OrdersPage() {
  return (
    <>
      <PageHeader title="Orders" description="Sales and supply order deck for approved scope, fulfilment readiness, and commercial references." />
      <DocumentListPage title="Sales order queue" description="Approved order records, issue timing, and project references." kind="SALES_ORDER" />
    </>
  );
}