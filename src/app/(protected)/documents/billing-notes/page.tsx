export const dynamic = "force-dynamic";
import { AccountingDocumentListPage } from "@/components/documents/accounting-document-page";

export default function BillingNotesPage() {
  return <AccountingDocumentListPage moduleKey="billing_note" />;
}
