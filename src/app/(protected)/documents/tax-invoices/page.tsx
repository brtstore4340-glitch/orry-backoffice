export const dynamic = "force-dynamic";
import { AccountingDocumentListPage } from "@/components/documents/accounting-document-page";

export default function TaxInvoicesPage() {
  return <AccountingDocumentListPage moduleKey="tax_invoice" />;
}
