export const dynamic = "force-dynamic";
import { AccountingDocumentCreatePage } from "@/components/documents/accounting-document-page";

export default function NewExpensePage() {
  return <AccountingDocumentCreatePage moduleKey="expense" />;
}
