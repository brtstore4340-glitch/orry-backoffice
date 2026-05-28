import { ReactNode } from "react";

export function DetailPanel({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <section className="workspace chrome-panel detail-shell">
      <div className="section-heading">
        <div>
          <span className="eyebrow">รายละเอียดรายการ</span>
          <h2>{title}</h2>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}
