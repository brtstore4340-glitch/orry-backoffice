import { PageHeader } from "@/components/app-shell/page-header";
import { DocumentListPage } from "@/components/documents/document-list-page";

export default function BillingPage() {
  return (
    <>
      <PageHeader title="Billing" description="Tax-ready ORRY billing records with issue state, due dates, and collection visibility." />
      <DocumentListPage title="Billing queue" description="Issued billing records awaiting settlement or follow-up." kind="BILLING_RECORD" />
    </>
  );
}