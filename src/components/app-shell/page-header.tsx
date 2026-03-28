import { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  actions,
  eyebrow = "ORRY workspace"
}: {
  title: string;
  description: string;
  actions?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <header className="page-header chrome-panel">
      <div className="page-header-copy">
        <div className="breadcrumb-row">
          <span className="eyebrow">{eyebrow}</span>
          <span className="breadcrumb-divider">/</span>
          <span className="breadcrumb-current">{title}</span>
        </div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions ? <div className="page-header-actions">{actions}</div> : null}
    </header>
  );
}
