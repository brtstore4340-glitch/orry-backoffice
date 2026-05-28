export const dynamic = "force-dynamic";
import { AccountingDocumentListPage } from "@/components/documents/accounting-document-page";

export default function CashInvoicesPage() {
  return <AccountingDocumentListPage moduleKey="cash_invoice" />;
}
