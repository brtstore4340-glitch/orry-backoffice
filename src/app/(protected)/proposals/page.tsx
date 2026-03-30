export const dynamic = 'force-dynamic'
import { PageHeader } from "@/components/app-shell/page-header";
import { DocumentListPage } from "@/components/documents/document-list-page";

export default function ProposalsPage() {
  return (
    <>
      <PageHeader title="Proposals" description="Commercial proposal desk with approval-ready ORRY offer packs and campaign briefs." />
      <DocumentListPage title="Proposal queue" description="Document states, commercial totals, and linked accounts for current proposal work." kind="PROPOSAL" />
    </>
  );
}