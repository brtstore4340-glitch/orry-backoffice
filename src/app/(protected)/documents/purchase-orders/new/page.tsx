export const dynamic = "force-dynamic";
import { AccountingDocumentCreatePage } from "@/components/documents/accounting-document-page";

export default function NewPurchaseOrderPage() {
  return <AccountingDocumentCreatePage moduleKey="purchase_order" />;
}
