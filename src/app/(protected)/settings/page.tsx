export const dynamic = 'force-dynamic'
export const runtime = 'nodejs';
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { requireRole } from "@/lib/authorization";
import { recordSecurityEvent } from "@/lib/audit";
import { PageHeader } from "@/components/app-shell/page-header";
import { DataTable } from "@/components/data-table/data-table";
import { Workspace } from "@/components/app-shell/workspace";
import { getCompanyProfile } from "@/lib/repository";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  try {
    requireRole(session.user, ["ADMIN", "EXECUTIVE"]);
  } catch (error) {
    await recordSecurityEvent({
      actorId: session.user.id,
      action: "settings.access.denied",
      success: false,
      targetType: "CompanyProfile",
      detail: "Settings access denied."
    });
    redirect("/dashboard");
  }

  const company = await getCompanyProfile();

  return (
    <>
      <PageHeader title="Settings" description="Issuer identity, bank accounts, and the Supabase-only operational contract for ORRY." />
      <div className="content-grid two-up">
        <Workspace>
          <div className="section-heading">
            <div>
              <span className="eyebrow">Issuer profile</span>
              <h2>Company profile</h2>
              <p>Legal identity used on proposals, billing, and receipts.</p>
            </div>
          </div>
          <dl className="definition-list settings-grid">
            <div><dt>Display name</dt><dd>{company.displayName}</dd></div>
            <div><dt>Legal name</dt><dd>{company.legalName}</dd></div>
            <div><dt>Tax ID</dt><dd>{company.taxId ?? "-"}</dd></div>
            <div><dt>Branch</dt><dd>{company.branchName ?? "-"} {company.branchCode ? `(${company.branchCode})` : ""}</dd></div>
            <div><dt>Email</dt><dd>{company.email ?? "-"}</dd></div>
            <div><dt>Website</dt><dd>{company.website ?? "-"}</dd></div>
            <div><dt>Address</dt><dd>{company.address ?? "-"}</dd></div>
          </dl>
        </Workspace>
        <Workspace>
          <div className="section-heading">
            <div>
              <span className="eyebrow">Platform contract</span>
              <h2>Supabase setup notes</h2>
              <p>Environment and storage targets expected by the ORRY deployment.</p>
            </div>
          </div>
          <ul className="bullet-stack settings-notes">
            <li>Database connectivity is driven by <code>DATABASE_URL</code> and <code>DIRECT_URL</code>.</li>
            <li>Supabase Auth manages sessions while the ORRY user table remains the source of truth for role, approval, and activity checks.</li>
            <li>Attachment metadata is modeled now; document uploads should target <code>SUPABASE_STORAGE_BUCKET</code>.</li>
            <li>Public project URL and publishable key are surfaced via the <code>NEXT_PUBLIC_SUPABASE_*</code> variables.</li>
          </ul>
        </Workspace>
      </div>
      <Workspace>
        <div className="section-heading">
          <div>
            <span className="eyebrow">Settlement rails</span>
            <h2>Settlement accounts</h2>
            <p>Accounts presented on billing and receipt surfaces.</p>
          </div>
          <div className="section-meta-chip">{company.bankAccounts.length} settlement accounts</div>
        </div>
        <DataTable
          columns={["Bank", "Account name", "Number", "Branch", "Primary"]}
          rows={company.bankAccounts.map((account) => [
            account.bankName,
            account.accountName,
            account.accountNumber,
            account.branch ?? "-",
            account.isPrimary ? "Yes" : "No"
          ])}
        />
      </Workspace>
    </>
  );
}

