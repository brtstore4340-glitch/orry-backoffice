export const dynamic = 'force-dynamic'
import Link from "next/link";
import { PageHeader } from "@/components/app-shell/page-header";
import { MetricStrip, Workspace } from "@/components/app-shell/workspace";
import { DataTable } from "@/components/data-table/data-table";
import { StatusBadge } from "@/components/status/status-badge";
import { getDashboardSnapshot } from "@/lib/repository";

export default async function DashboardPage() {
  const snapshot = await getDashboardSnapshot();

  return (
    <>
      <PageHeader
        title="Commercial command"
        description="Live visibility across proposals, billing, receipts, account readiness, and stock pressure."
        actions={<div className="section-meta-chip">Updated from live repository data</div>}
      />
      <Workspace className="hero-workspace">
        <div className="hero-band">
          <div className="hero-copy">
            <span className="eyebrow">Executive overview</span>
            <h2>Calm visibility for sales, fulfilment, billing, and collection control.</h2>
            <p>The ORRY command center keeps high-priority commercial movements, account pressure, and stock posture visible without collapsing into dashboard noise.</p>
          </div>
          <div className="hero-highlight subtle-panel">
            <small>Priority watch</small>
            <strong>{snapshot.urgentQueue.length} active pressure points</strong>
            <p>Approvals, fulfilment readiness, and settlement actions requiring follow-through today.</p>
          </div>
        </div>
        <MetricStrip items={snapshot.metrics} />
      </Workspace>
      <div className="content-grid two-up">
        <Workspace>
          <div className="section-heading">
            <div>
              <span className="eyebrow">Action queue</span>
              <h2>Urgent queue</h2>
              <p>Operational pressure points that need action today.</p>
            </div>
          </div>
          <DataTable
            columns={["Area", "Status", "Action note"]}
            rows={snapshot.urgentQueue.map((item) => [
              item.area,
              <StatusBadge key={item.area} label={item.status} tone={item.status.toLowerCase().includes("await") ? "warning" : "info"} />,
              item.note
            ])}
          />
        </Workspace>
        <Workspace>
          <div className="section-heading">
            <div>
              <span className="eyebrow">Activity stream</span>
              <h2>Recent activity</h2>
              <p>Server-side activity trail across the ORRY document chain.</p>
            </div>
          </div>
          <div className="timeline">
            {snapshot.recentActivity.map((activity) => (
              <article key={activity.id} className="timeline-item subtle-panel">
                <div className="timeline-item-head">
                  <strong>{activity.action}</strong>
                  <span className="timeline-date">{activity.createdAt}</span>
                </div>
                <p>{activity.detail}</p>
                <small>{activity.actor ?? "System operator"}</small>
              </article>
            ))}
          </div>
        </Workspace>
      </div>
      <div className="content-grid two-up">
        <Workspace>
          <div className="section-heading">
            <div>
              <span className="eyebrow">Commercial records</span>
              <h2>Recent documents</h2>
              <p>Jump directly into active commercial records.</p>
            </div>
          </div>
          <DataTable
            columns={["Document", "Account", "Status", "Issued", "Total"]}
            rows={snapshot.recentDocuments.map((document) => [
              <Link key={`${document.id}-link`} href={`/documents/${document.id}`} className="inline-link">{document.documentNumber}</Link>,
              document.accountName,
              <StatusBadge key={`${document.id}-status`} label={document.status} />,
              document.issuedAt,
              new Intl.NumberFormat("en-US", { style: "currency", currency: "THB" }).format(document.totalAmount)
            ])}
          />
        </Workspace>
        <Workspace>
          <div className="section-heading">
            <div>
              <span className="eyebrow">Inventory pressure</span>
              <h2>Stock pressure</h2>
              <p>Inventory items that need monitoring before campaign demand increases.</p>
            </div>
          </div>
          <div className="stack-list">
            {snapshot.lowStock.map((product) => (
              <article key={product.id} className="subtle-panel list-row emphasis-row">
                <div>
                  <strong>{product.name}</strong>
                  <p>{product.sku} ยท reorder at {product.reorderPoint}</p>
                </div>
                <div className="value-block">
                  <strong>{product.stockOnHand}</strong>
                  <small>units on hand</small>
                </div>
              </article>
            ))}
          </div>
        </Workspace>
      </div>
    </>
  );
}
