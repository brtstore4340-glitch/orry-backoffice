export const dynamic = "force-dynamic";
import { AccountingDocumentListPage } from "@/components/documents/accounting-document-page";

export default function ExpensesPage() {
  return <AccountingDocumentListPage moduleKey="expense" />;
}
