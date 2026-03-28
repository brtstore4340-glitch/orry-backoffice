import { ReactNode } from "react";

export function Workspace({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`workspace chrome-panel ${className}`.trim()}>{children}</section>;
}

export function MetricStrip({ items }: { items: Array<{ label: string; value: string; hint?: string }> }) {
  return (
    <div className="metrics">
      {items.map((item) => (
        <article className="metric subtle-panel" key={item.label}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
          {item.hint ? <small>{item.hint}</small> : null}
        </article>
      ))}
    </div>
  );
}
