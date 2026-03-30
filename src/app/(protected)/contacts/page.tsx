export const dynamic = 'force-dynamic'
import { PageHeader } from "@/components/app-shell/page-header";
import { DataTable } from "@/components/data-table/data-table";
import { SimpleForm } from "@/components/forms/simple-form";
import { StatusBadge } from "@/components/status/status-badge";
import { Workspace } from "@/components/app-shell/workspace";
import { createContactAction } from "@/app/(protected)/actions";
import { getContacts } from "@/lib/repository";

export default async function ContactsPage() {
  const contacts = await getContacts();

  return (
    <>
      <PageHeader title="Accounts" description="Customer, vendor, and partner records used across proposals, orders, billing, and collection." />
      <div className="content-grid two-up">
        <SimpleForm title="Create account" description="Create a live account record with ORRY-owned naming and contact metadata.">
          <form action={createContactAction} className="stack-form compact-form">
            <label>
              <span>Account code</span>
              <input className="input" name="code" placeholder="ACCT-003" />
            </label>
            <label>
              <span>Display name</span>
              <input className="input" name="displayName" placeholder="New retail partner" />
            </label>
            <label>
              <span>Contact person</span>
              <input className="input" name="contactPerson" placeholder="Primary buyer" />
            </label>
            <label>
              <span>Email</span>
              <input className="input" name="email" type="email" placeholder="contact@account.co" />
            </label>
            <button className="button" type="submit">Create account</button>
          </form>
        </SimpleForm>
        <Workspace>
          <div className="section-heading">
            <div>
              <span className="eyebrow">Health overview</span>
              <h2>Account health</h2>
              <p>Document workload and communication readiness for active accounts.</p>
            </div>
          </div>
          <div className="stack-list">
            {contacts.slice(0, 3).map((contact) => (
              <article key={contact.id} className="subtle-panel list-row emphasis-row">
                <div>
                  <strong>{contact.displayName}</strong>
                  <p>{contact.contactPerson ?? "No contact owner"}</p>
                </div>
                <StatusBadge label={`${contact.openDocuments} open`} tone={contact.openDocuments ? "warning" : "success"} />
              </article>
            ))}
          </div>
        </Workspace>
      </div>
      <Workspace>
        <div className="section-heading">
          <div>
            <span className="eyebrow">Directory</span>
            <h2>All accounts</h2>
            <p>Operational directory for customer, vendor, and partner records.</p>
          </div>
          <div className="section-meta-chip">{contacts.length} accounts</div>
        </div>
        <DataTable
          columns={["Code", "Name", "Type", "Owner", "Email", "Open docs"]}
          rows={contacts.map((contact) => [
            contact.code,
            contact.displayName,
            contact.type.replaceAll("_", " "),
            contact.contactPerson ?? "-",
            contact.email ?? "-",
            contact.openDocuments.toString()
          ])}
        />
      </Workspace>
    </>
  );
}
