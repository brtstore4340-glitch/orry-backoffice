import styles from "@/components/orry/erp.module.css";
import { OrryStatusBadge } from "@/components/orry/orry-status-badge";
import type { ActivityLogEntry } from "@/lib/orry/schema";

export function OrryActivityPanel({ items }: { items: ActivityLogEntry[] }) {
  return (
    <aside className={styles.activityPanel}>
      <span className={styles.sectionLabel}>Activity</span>
      <p className={styles.sectionText}>Recent ERP workflow actions for this module.</p>
      <ul className={styles.activityList}>
        {items.map((item) => (
          <li className={styles.activityItem} key={item.id}>
            <div className={styles.activityHeader}>
              <strong>{item.action}</strong>
              <OrryStatusBadge label={item.result} tone={item.result === "SUCCESS" ? "ok" : item.result === "WARNING" ? "warning" : "critical"} />
            </div>
            <p className={styles.activityDetail}>{item.detail}</p>
            <small className={styles.activityTime}>
              {item.user} · {new Date(item.timestamp).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
            </small>
          </li>
        ))}
      </ul>
    </aside>
  );
}
