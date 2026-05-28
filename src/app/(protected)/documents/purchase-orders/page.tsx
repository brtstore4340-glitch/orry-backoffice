export const dynamic = "force-dynamic";
import { AccountingDocumentListPage } from "@/components/documents/accounting-document-page";

export default function PurchaseOrdersPage() {
  return <AccountingDocumentListPage moduleKey="purchase_order" />;
}
