import styles from "@/components/dashboard/dashstack-dashboard.module.css";
import type { DashboardStatCardModel } from "@/lib/dashboard/dashboard-data";

export function DashboardStatCard({ label, value, trend, tone, accent }: DashboardStatCardModel) {
  return (
    <article className={`${styles.statCard} ${styles[`accent${capitalize(accent)}`]}`.trim()}>
      <div className={styles.statHeader}>
        <span>{label}</span>
        <span className={`${styles.trendBadge} ${tone === "positive" ? styles.trendPositive : styles.trendNegative}`.trim()}>
          {trend}
        </span>
      </div>
      <strong>{value}</strong>
      <div className={styles.miniBars} aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>
    </article>
  );
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
