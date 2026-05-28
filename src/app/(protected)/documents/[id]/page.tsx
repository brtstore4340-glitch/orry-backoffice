export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import { AccountingDocumentDetailPage } from "@/components/documents/accounting-document-page";
import { getDocumentById } from "@/lib/repository";
import { resolveModuleKeyFromDocument } from "@/lib/accounting-documents";

export default async function GenericDocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const document = await getDocumentById(id);
  if (!document) {
    notFound();
  }

  return <AccountingDocumentDetailPage moduleKey={resolveModuleKeyFromDocument(document)} id={id} />;
}
