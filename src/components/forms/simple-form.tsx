import type { ReactNode } from "react";

export function SimpleForm({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="workspace chrome-panel form-shell">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Input surface</span>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}
