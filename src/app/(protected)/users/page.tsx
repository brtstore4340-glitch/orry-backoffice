export const dynamic = 'force-dynamic'
export const runtime = "nodejs";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PageHeader } from "@/components/app-shell/page-header";
import { SimpleForm } from "@/components/forms/simple-form";
import { StatusBadge } from "@/components/status/status-badge";
import { requireRole, requireUser } from "@/lib/authorization";
import { getPasswordPolicyHint } from "@/lib/password-policy";
import { listManagedUsers, listPendingRegistrations } from "@/lib/user-management";
import { createManagedUserAction, reviewRegistrationAction } from "./actions";

function renderMessage(search: { status?: string; error?: string }) {
  if (search.error === "email") {
    return <p className="security-note danger-note">User creation could not be completed because credential email delivery is unavailable.</p>;
  }
  if (search.error) {
    return <p className="security-note danger-note">User management action could not be completed.</p>;
  }
  if (search.status === "created") {
    return <p className="security-note success-note">User created and credential email dispatched.</p>;
  }
  if (search.status === "reviewed") {
    return <p className="security-note success-note">Registration status updated.</p>;
  }
  return null;
}

export default async function UsersPage({
  searchParams
}: {
  searchParams?: Promise<{ status?: string; error?: string }>;
}) {
  const session = await auth();
  const user = requireUser(session);
  try {
    requireRole(user, ["ADMIN"]);
  } catch {
    redirect("/dashboard");
  }

  const [pendingUsers, managedUsers, search] = await Promise.all([
    listPendingRegistrations(),
    listManagedUsers(),
    searchParams ?? Promise.resolve({})
  ]);

  return (
    <>
      <PageHeader
        title="User Access"
        description="Approve registrations and create internal users without changing the main ORRY workspace structure."
        eyebrow="Administration"
      />

      {renderMessage(search)}

      <section className="workspace chrome-panel">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Approval queue</span>
            <h2>Pending registrations</h2>
            <p>Only approved accounts can sign in. Rejecting a registration blocks access immediately.</p>
          </div>
        </div>
        {pendingUsers.length ? (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Employee ID</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingUsers.map((pending) => (
                  <tr key={pending.id}>
                    <td>{pending.firstName} {pending.lastName}</td>
                    <td>{pending.email}</td>
                    <td>{pending.employeeId ?? "-"}</td>
                    <td>{new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(pending.createdAt)}</td>
                    <td><StatusBadge label={pending.approvalStatus} tone="warning" /></td>
                    <td>
                      <div className="inline-action-row">
                        <form action={reviewRegistrationAction}>
                          <input type="hidden" name="userId" value={pending.id} />
                          <input type="hidden" name="decision" value="approve" />
                          <button className="button compact-button" type="submit">Approve</button>
                        </form>
                        <form action={reviewRegistrationAction}>
                          <input type="hidden" name="userId" value={pending.id} />
                          <input type="hidden" name="decision" value="reject" />
                          <button className="button ghost-button compact-button" type="submit">Reject</button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty-state">No registrations are waiting for approval.</p>
        )}
      </section>

      <SimpleForm
        title="Create user"
        description="Admin-created users are approved immediately and receive the same temporary password email flow as registered users."
      >
        <form action={createManagedUserAction} className="stack-form form-grid two-column-form">
          <label>
            <span>Email</span>
            <input className="input" name="email" type="email" required />
          </label>
          <label>
            <span>Employee ID</span>
            <input className="input" name="employeeId" type="text" required />
          </label>
          <label>
            <span>First Name</span>
            <input className="input" name="firstName" type="text" required />
          </label>
          <label>
            <span>Last Name</span>
            <input className="input" name="lastName" type="text" required />
          </label>
          <label className="full-span">
            <span>Date of Birth</span>
            <input className="input" name="dateOfBirth" type="date" required />
          </label>
          <p className="inline-note full-span">New passwords must follow this policy after reset: {getPasswordPolicyHint()}</p>
          <div className="full-span">
            <button className="button" type="submit">Create user</button>
          </div>
        </form>
      </SimpleForm>

      <section className="workspace chrome-panel">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Current access</span>
            <h2>Recent users</h2>
            <p>Default role is assigned conservatively until a richer role-management surface exists.</p>
          </div>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Employee ID</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {managedUsers.map((managed) => (
                <tr key={managed.id}>
                  <td>{managed.firstName} {managed.lastName}</td>
                  <td>{managed.email}</td>
                  <td>{managed.employeeId ?? "-"}</td>
                  <td>{managed.role.code}</td>
                  <td>
                    <StatusBadge
                      label={managed.active ? managed.approvalStatus : "INACTIVE"}
                      tone={managed.active ? (managed.approvalStatus === "APPROVED" ? "success" : managed.approvalStatus === "REJECTED" ? "danger" : "warning") : "danger"}
                    />
                  </td>
                  <td>{new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(managed.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
