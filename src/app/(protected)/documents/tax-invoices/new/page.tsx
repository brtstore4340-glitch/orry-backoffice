export const dynamic = "force-dynamic";
import { AccountingDocumentCreatePage } from "@/components/documents/accounting-document-page";

export default function NewTaxInvoicePage() {
  return <AccountingDocumentCreatePage moduleKey="tax_invoice" />;
}
