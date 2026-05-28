export const dynamic = "force-dynamic";
import { AccountingDocumentDetailPage } from "@/components/documents/accounting-document-page";

export default async function BillingNoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AccountingDocumentDetailPage moduleKey="billing_note" id={id} />;
}
