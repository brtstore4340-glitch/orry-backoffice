import { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  actions,
  eyebrow = "พื้นที่ทำงาน ORRY"
}: {
  title: string;
  description: string;
  actions?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <header className="page-header chrome-panel">
      <div className="page-header-copy page-header-lead">
        <div className="breadcrumb-row">
          <span className="eyebrow">{eyebrow}</span>
          <span className="breadcrumb-divider">/</span>
          <span className="breadcrumb-current">{title}</span>
        </div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="page-header-side">
        <div className="section-meta-chip">ORRY Workspace</div>
        {actions ? <div className="page-header-actions">{actions}</div> : null}
      </div>
    </header>
  );
}
